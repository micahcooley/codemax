/* Codemax Local Tools: an independent, native stdio MCP server.
* The Zag backend owns task state, consent, routing and the tool-call policy.
* This process implements bounded OS operations; it is not the app backend.
* Copyright 2026 Codemax contributors. SPDX-License-Identifier: MIT
*/
#define _GNU_SOURCE
#include <json-c/json.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/wait.h>
#include <sys/resource.h>
#include <sys/prctl.h>
#include <linux/openat2.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>
#include <poll.h>
#include <dirent.h>
#include <errno.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>
#include <time.h>
#define VERSION "0.2.0"
#define MCP_CURRENT "2026-07-28"
#define MAX_FRAME 131072
#define MAX_FILE 1048576
#define MAX_TEXT 16000
#define MAX_OUTPUT 16000
#define MAX_ENTRIES 512
static int root_fd = -1;
static bool writes_allowed, commands_allowed, legacy_initialized, legacy_pending;
static char workspace[PATH_MAX];
static volatile sig_atomic_t interrupted;
static pid_t active_child;
typedef struct json_object J;
static J *active_request_id;
static bool call_cancelled;
static char *input_line;
static size_t input_used;
static char *deferred[8];
static size_t deferred_count;
static bool unique_keys(const char *s,size_t len);
static void process_line(char *line,size_t n);
static void read_during_command(void);
static J *obj(void)  {
    return json_object_new_object();
}
static J *arr(void)  {
    return json_object_new_array();
}
static void field(J *o,const char *k,J *v) {
    json_object_object_add(o,k,v);
}
static void str(J *o,const char *k,const char *v) {
    field(o,k,json_object_new_string(v));
}
static void boolean(J *o,const char *k,bool v) {
    field(o,k,json_object_new_boolean(v));
}
static void integer(J *o,const char *k,int64_t v) {
    field(o,k,json_object_new_int64(v));
}
static J *get(J *o,const char *k) {
    J *v=NULL;
    if(o && json_object_get_type(o)==json_type_object)json_object_object_get_ex(o,k,&v);
    return v;
}
static const char *text(J *o,const char *k) {
    J *v=get(o,k);
    if(!v||json_object_get_type(v)!=json_type_string)return NULL;
    const char *s=json_object_get_string(v);
    return (size_t)json_object_get_string_len(v)==strlen(s)?s:NULL;
}
static bool truth(J *o,const char *k) {
    J *v=get(o,k);
    return v&&json_object_get_type(v)==json_type_boolean&&json_object_get_boolean(v);
}
static int64_t number(J *o,const char *k,int64_t fallback) {
    J *v=get(o,k);
    return v&&json_object_get_type(v)==json_type_int?json_object_get_int64(v):fallback;
}
static uint64_t now_ms(void) {
    struct timespec t;
    if(clock_gettime(CLOCK_MONOTONIC,&t))return 0;
    return (uint64_t)t.tv_sec*1000+(uint64_t)t.tv_nsec/1000000;
}
static void on_signal(int s) {
    (void)s;
    interrupted=1;
    if(active_child>0)kill(-active_child,SIGKILL);
}
static J *failure(const char *code) {
    J *o=obj();
    boolean(o,"ok",false);
    str(o,"code",code);
    return o;
}
static const char *io_code(void) {
    switch(errno) {
        case ENOENT:return "NOT_FOUND";
        case EEXIST:return "ALREADY_EXISTS";
        case EACCES:case EPERM:return "ACCESS_DENIED";
        case EXDEV:case ELOOP:return "PATH_ESCAPE_OR_LINK_DENIED";
        case ENOSYS:return "OPENAT2_REQUIRED";
        case ENOTDIR:return "NOT_A_DIRECTORY";
        default:return "FILESYSTEM_ERROR";
    }
}
static uint32_t rotr(uint32_t x, unsigned n) { return (x >> n) | (x << (32 - n)); }
/* SHA-256 with explicit uint32_t modular arithmetic; no provider/runtime loading. */
static void digest(const unsigned char *data, size_t length, char out[65]) {
    static const uint32_t k[64] = {
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    };
    uint32_t h[8] = {0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19};
    const size_t total = ((length + 9 + 63) / 64) * 64;
    const uint64_t bits = (uint64_t)length * 8;
    for (size_t base=0; base<total; base+=64) {
        uint32_t w[64] = {0};
        for (size_t i=0; i<64; i++) {
            size_t at=base+i;
            unsigned char byte = at<length ? data[at] : at==length ? 0x80 :
                at>=total-8 ? (unsigned char)(bits >> ((total-1-at)*8)) : 0;
            w[i/4] |= (uint32_t)byte << (24 - (i%4)*8);
        }
        for (size_t i=16; i<64; i++) {
            uint32_t s0=rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>3);
            uint32_t s1=rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>10);
            w[i]=w[i-16]+s0+w[i-7]+s1;
        }
        uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
        for(size_t i=0;i<64;i++) {
            uint32_t s1=rotr(e,6)^rotr(e,11)^rotr(e,25);
            uint32_t t1=hh+s1+((e&f)^(~e&g))+k[i]+w[i];
            uint32_t s0=rotr(a,2)^rotr(a,13)^rotr(a,22);
            uint32_t t2=s0+((a&b)^(a&c)^(b&c));
            hh=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;
        }
        h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=hh;
    }
    for (size_t i=0;i<8;i++) snprintf(out+i*8,9,"%08x",h[i]);
    out[64]=0;
}
static bool random_name(char out[65]) {
    unsigned char d[24];
    size_t n=0;
    while(n<sizeof d) {
        ssize_t r=syscall(SYS_getrandom,d+n,sizeof d-n,0);
        if(r<0&&errno==EINTR)continue;
        if(r<=0)return false;
        n+=(size_t)r;
    }
    memcpy(out,".codemax-",9);
    for(size_t i=0;i<sizeof d;i++)snprintf(out+9+i*2,3,"%02x",d[i]);
    return true;
}
static bool secret_component(const char *s,size_t n) {
    const char *exact[]= {
        ".ssh",".aws",".gnupg",".netrc",".npmrc",".pypirc",".git-credentials",".codemax-trash"
    };
    for(size_t i=0;i<sizeof exact/sizeof *exact;i++)if(strlen(exact[i])==n&&!strncmp(s,exact[i],n))return true;
    return (n>=4&&!strncmp(s,".env",4)&&(n==4||s[4]=='.'))||(n>=9&&!strncmp(s,".codemax-",9));
}
static bool valid_path(const char *p,bool dot) {
    if(!p||!p[0]||strlen(p)>=PATH_MAX||p[0]=='/'||strchr(p,'\\'))return false;
    if(dot&&!strcmp(p,"."))return true;
    const char *s=p;
    for(const char *q=p;;q++) {
        if(*q && ((unsigned char)*q<32||(unsigned char)*q==127))return false;
        if(!*q||*q=='/') {
            size_t n=(size_t)(q-s);
            if(n==0||(n==1&&s[0]=='.')||(n==2&&!memcmp(s,"..",2))||secret_component(s,n))return false;
            if(!*q)break;
            s=q+1;
        }
    }
    return true;
}
static int open_beneath(int base,const char *path,int flags,mode_t mode) {
    struct open_how how= {
        .flags=(uint64_t)(flags|O_CLOEXEC|O_NOFOLLOW),.mode=mode,.resolve=RESOLVE_BENEATH|RESOLVE_NO_MAGICLINKS|RESOLVE_NO_SYMLINKS|RESOLVE_NO_XDEV
    };
    int fd;
    do {
        fd=(int)syscall(SYS_openat2,base,path,&how,sizeof how);
    }
    while(fd<0&&errno==EINTR);
    return fd;
}
static int open_parent(const char *path,char leaf[NAME_MAX+1]) {
    if(!valid_path(path,false)) {
        errno=EPERM;
        return -1;
    }
    const char *slash=strrchr(path,'/');
    const char *name=slash?slash+1:path;
    if(strlen(name)>NAME_MAX) {
        errno=ENAMETOOLONG;
        return -1;
    }
    strcpy(leaf,name);
    if(!slash)return fcntl(root_fd,F_DUPFD_CLOEXEC,3);
    char parent[PATH_MAX];
    size_t n=(size_t)(slash-path);
    memcpy(parent,path,n);
    parent[n]=0;
    return open_beneath(root_fd,parent,O_RDONLY|O_DIRECTORY,0);
}
static bool regular_private(int fd,struct stat *st) {
    return !fstat(fd,st)&&S_ISREG(st->st_mode)&&st->st_nlink==1&&st->st_size>=0&&st->st_size<=MAX_FILE;
}
static unsigned char *read_all(int fd,size_t *length) {
    struct stat before,after;
    if(!regular_private(fd,&before)) {
        errno=EPERM;
        return NULL;
    }
    size_t size=(size_t)before.st_size;
    unsigned char *b=malloc(size+1);
    if(!b)return NULL;
    size_t n=0;
    while(n<size) {
        ssize_t r=pread(fd,b+n,size-n,(off_t)n);
        if(r<0&&errno==EINTR)continue;
        if(r<=0) {
            free(b);
            errno=EIO;
            return NULL;
        }
        n+=(size_t)r;
    }
    if(fstat(fd,&after)||before.st_dev!=after.st_dev||before.st_ino!=after.st_ino||before.st_size!=after.st_size||after.st_nlink!=1||before.st_ctim.tv_sec!=after.st_ctim.tv_sec||before.st_ctim.tv_nsec!=after.st_ctim.tv_nsec||before.st_mtim.tv_sec!=after.st_mtim.tv_sec||before.st_mtim.tv_nsec!=after.st_mtim.tv_nsec) {
        free(b);
        errno=ESTALE;
        return NULL;
    }
    b[size]=0;
    *length=size;
    return b;
}
static bool utf8(const unsigned char *s,size_t n) {
    for(size_t i=0;i<n;) {
        uint32_t c=s[i++];
        if(c==0)return false;
        if(c<128)continue;
        unsigned k;
        uint32_t min;
        if(c>=0xc2&&c<=0xdf) {
            k=1;
            min=0x80;
            c&=31;
        }
        else if(c>=0xe0&&c<=0xef) {
            k=2;
            min=0x800;
            c&=15;
        }
        else if(c>=0xf0&&c<=0xf4) {
            k=3;
            min=0x10000;
            c&=7;
        }
        else return false;
        if(i+k>n)return false;
        while(k--) {
            unsigned x=s[i++];
            if((x&0xc0)!=0x80)return false;
            c=(c<<6)|(x&63);
        }
        if(c<min||c>0x10ffff||(c>=0xd800&&c<=0xdfff))return false;
    }
    return true;
}
static bool expected(J *args,const unsigned char *data,size_t n) {
    const char *s=text(args,"expected_sha256");
    char actual[65];
    digest(data,n,actual);
    return s&&strlen(s)==64&&!strcmp(s,actual);
}
static bool same_inode(int parent,const char *leaf,int fd) {
    struct stat a,b;
    return !fstat(fd,&a)&&!fstatat(parent,leaf,&b,AT_SYMLINK_NOFOLLOW)&&a.st_dev==b.st_dev&&a.st_ino==b.st_ino&&a.st_nlink==1&&S_ISREG(b.st_mode);
}
static J *read_file(J *args) {
    const char *p=text(args,"path");
    if(!valid_path(p,false))return failure("PATH_DENIED");
    int fd=open_beneath(root_fd,p,O_RDONLY|O_NONBLOCK,0);
    if(fd<0)return failure(io_code());
    size_t n=0;
    unsigned char *data=read_all(fd,&n);
    close(fd);
    if(!data)return failure("REGULAR_SINGLE_LINK_FILE_REQUIRED");
    if(!utf8(data,n)) {
        free(data);
        return failure("TEXT_FILE_REQUIRED");
    }
    int64_t off=number(args,"offset",0),count=number(args,"length",MAX_TEXT);
    if(off<0||(uint64_t)off>n||count<1||count>MAX_TEXT) {
        free(data);
        return failure("INVALID_RANGE");
    }
    if(off>0&&(data[off]&0xc0)==0x80) {
        free(data);
        return failure("UTF8_BOUNDARY_REQUIRED");
    }
    size_t end=(size_t)off+(size_t)count;
    if(end>n)end=n;
    while(end<n&&(data[end]&0xc0)==0x80)end--;
    char hash[65];
    digest(data,n,hash);
    J *o=obj();
    boolean(o,"ok",true);
    str(o,"path",p);
    integer(o,"size",(int64_t)n);
    str(o,"sha256",hash);
    field(o,"text",json_object_new_string_len((char*)data+off,(int)(end-(size_t)off)));
    boolean(o,"truncated",end<n);
    integer(o,"next_offset",(int64_t)end);
    free(data);
    return o;
}
static bool write_all(int fd,const unsigned char *data,size_t n) {
    size_t at=0;
    while(at<n) {
        ssize_t w=write(fd,data+at,n-at);
        if(w<0&&errno==EINTR)continue;
        if(w<=0)return false;
        at+=(size_t)w;
    }
    return true;
}
static J *write_bytes(J *args,const unsigned char *bytes,size_t n,bool edit) {
    if(!writes_allowed)return failure("WRITE_PERMISSION_REQUIRED");
    const char *path=text(args,"path");
    char leaf[NAME_MAX+1];
    int parent=open_parent(path,leaf);
    if(parent<0)return failure(io_code());
    int current=open_beneath(parent,leaf,O_RDONLY|O_NONBLOCK,0);
    bool exists=current>=0;
    if(!exists&&errno!=ENOENT) {
        close(parent);
        return failure(io_code());
    }
    if(exists) {
        size_t oldn=0;
        unsigned char *old=read_all(current,&oldn);
        bool matches=old&&expected(args,old,oldn);
        free(old);
        if(!matches) {
            close(current);
            close(parent);
            return failure("REVISION_CONFLICT");
        }
    }
    else if(edit||get(args,"expected_sha256")) {
        close(parent);
        return failure("REVISION_CONFLICT");
    }
    char temp[65];
    if(!random_name(temp)) {
        if(exists)close(current);
        close(parent);
        return failure("ENTROPY_UNAVAILABLE");
    }
    int fd=open_beneath(parent,temp,O_WRONLY|O_CREAT|O_EXCL,0600);
    if(fd<0) {
        if(exists)close(current);
        close(parent);
        return failure(io_code());
    }
    bool ok=write_all(fd,bytes,n)&&fsync(fd)==0;
    struct stat st;
    if(ok&&exists)ok=fstat(current,&st)==0&&fchmod(fd,st.st_mode&0777)==0;
    if(ok && fsync(fd))ok=false;
    if(close(fd))ok=false;
    if(ok&&exists)ok=same_inode(parent,leaf,current);
    if(ok)ok=syscall(SYS_renameat2,parent,temp,parent,leaf,exists?0:RENAME_NOREPLACE)==0;
    if(exists)close(current);
    if(!ok) {
        unlinkat(parent,temp,0);
        close(parent);
        return failure("ATOMIC_WRITE_FAILED");
    }
    bool durable=fsync(parent)==0;
    close(parent);
    char hash[65];
    digest(bytes,n,hash);
    J *o=obj();
    boolean(o,"ok",true);
    str(o,"path",path);
    str(o,"sha256",hash);
    integer(o,"bytes_written",(int64_t)n);
    boolean(o,"directory_synced",durable);
    return o;
}
static J *write_file(J *args) {
    const char *s=text(args,"text");
    if(!s||strlen(s)>MAX_TEXT)return failure("TEXT_LIMIT_OR_INVALID");
    return write_bytes(args,(const unsigned char*)s,strlen(s),false);
}
static J *edit_file(J *args) {
    const char *p=text(args,"path"),*old=text(args,"old_text"),*replacement=text(args,"new_text");
    if(!valid_path(p,false)||!old||!*old||!replacement)return failure("INVALID_EDIT");
    int fd=open_beneath(root_fd,p,O_RDONLY|O_NONBLOCK,0);
    if(fd<0)return failure(io_code());
    size_t n=0;
    unsigned char *data=read_all(fd,&n);
    close(fd);
    if(!data||!utf8(data,n)) {
        free(data);
        return failure("TEXT_FILE_REQUIRED");
    }
    if(!expected(args,data,n)) {
        free(data);
        return failure("REVISION_CONFLICT");
    }
    char *match=strstr((char*)data,old);
    if(!match||strstr(match+1,old)) {
        free(data);
        return failure("EDIT_MATCH_MUST_BE_UNIQUE");
    }
    size_t newn=n-strlen(old)+strlen(replacement);
    if(newn>MAX_FILE) {
        free(data);
        return failure("FILE_LIMIT");
    }
    unsigned char *next=malloc(newn+1);
    if(!next) {
        free(data);
        return failure("MEMORY_LIMIT");
    }
    size_t prefix=(size_t)(match-(char*)data);
    memcpy(next,data,prefix);
    memcpy(next+prefix,replacement,strlen(replacement));
    memcpy(next+prefix+strlen(replacement),match+strlen(old),n-prefix-strlen(old));
    next[newn]=0;
    J *result=write_bytes(args,next,newn,true);
    free(next);
    free(data);
    return result;
}
static J *create_directory(J *args) {
    if(!writes_allowed)return failure("WRITE_PERMISSION_REQUIRED");
    char leaf[NAME_MAX+1];
    int p=open_parent(text(args,"path"),leaf);
    if(p<0)return failure(io_code());
    if(mkdirat(p,leaf,0700)) {
        const char *code=io_code();
        close(p);
        return failure(code);
    }
    bool synced=fsync(p)==0;
    close(p);
    J *o=obj();
    boolean(o,"ok",true);
    boolean(o,"directory_synced",synced);
    return o;
}
static J *delete_file(J *args) {
    if(!writes_allowed||!truth(args,"confirm"))return failure("DELETE_CONFIRMATION_REQUIRED");
    char leaf[NAME_MAX+1];
    int p=open_parent(text(args,"path"),leaf);
    if(p<0)return failure(io_code());
    int fd=open_beneath(p,leaf,O_RDONLY|O_NONBLOCK,0);
    if(fd<0) {
        const char *c=io_code();
        close(p);
        return failure(c);
    }
    size_t n=0;
    unsigned char *b=read_all(fd,&n);
    bool ok=b&&expected(args,b,n)&&same_inode(p,leaf,fd);
    free(b);
    if(!ok) {
        close(fd);
        close(p);
        return failure("REVISION_CONFLICT");
    }
    /* Move to a private trash directory. Never recursively delete a directory. */ if(mkdirat(root_fd,".codemax-trash",0700)&&errno!=EEXIST) {
        close(fd);
        close(p);
        return failure("TRASH_UNAVAILABLE");
    }
    int trash=open_beneath(root_fd,".codemax-trash",O_RDONLY|O_DIRECTORY,0);
    if(trash<0) {
        close(fd);
        close(p);
        return failure("TRASH_UNAVAILABLE");
    }
    struct stat ts;
    if(fstat(trash,&ts)||ts.st_uid!=getuid()||(ts.st_mode&077)) {
        close(fd);
        close(p);
        close(trash);
        return failure("TRASH_NOT_PRIVATE");
    }
    char name[65];
    ok=random_name(name);
    if(ok)ok=syscall(SYS_renameat2,p,leaf,trash,name,RENAME_NOREPLACE)==0;
    close(fd);
    bool synced=ok&&fsync(p)==0&&fsync(trash)==0;
    close(p);
    close(trash);
    if(!ok)return failure("DELETE_FAILED");
    J *o=obj();
    boolean(o,"ok",true);
    str(o,"recovery_id",name);
    str(o,"recovery_directory",".codemax-trash");
    boolean(o,"directory_synced",synced);
    return o;
}
static J *move_file(J *args) {
    if(!writes_allowed)return failure("WRITE_PERMISSION_REQUIRED");
    char from[NAME_MAX+1],to[NAME_MAX+1];
    int a=open_parent(text(args,"path"),from),b=open_parent(text(args,"destination"),to);
    if(a<0||b<0) {
        if(a>=0)close(a);
        if(b>=0)close(b);
        return failure("PATH_DENIED");
    }
    int fd=open_beneath(a,from,O_RDONLY|O_NONBLOCK,0);
    size_t n=0;
    unsigned char *data=fd<0?NULL:read_all(fd,&n);
    bool ok=data&&expected(args,data,n)&&same_inode(a,from,fd);
    free(data);
    if(!ok) {
        if(fd>=0)close(fd);
        close(a);
        close(b);
        return failure("REVISION_CONFLICT");
    }
    ok=syscall(SYS_renameat2,a,from,b,to,RENAME_NOREPLACE)==0;
    close(fd);
    bool synced=ok&&fsync(a)==0&&fsync(b)==0;
    const char *code=io_code();
    close(a);
    close(b);
    if(!ok)return failure(code);
    J *o=obj();
    boolean(o,"ok",true);
    boolean(o,"directory_synced",synced);
    return o;
}
static int entry_compare(const void *a,const void *b) {
    return strcmp(*(const char *const*)a,*(const char *const*)b);
}
static J *list_directory(J *args) {
    const char *path=text(args,"path");
    if(!path)path=".";
    if(!valid_path(path,true))return failure("PATH_DENIED");
    int fd=open_beneath(root_fd,path,O_RDONLY|O_DIRECTORY,0);
    if(fd<0)return failure(io_code());
    DIR *dir=fdopendir(fd);
    if(!dir) {
        close(fd);
        return failure("DIRECTORY_ERROR");
    }
    char *names[MAX_ENTRIES];
    size_t n=0;
    bool truncated=false;
    struct dirent *ent;
    while((ent=readdir(dir))) {
        if(!strcmp(ent->d_name,".")||!strcmp(ent->d_name,"..")||secret_component(ent->d_name,strlen(ent->d_name)))continue;
        if(n==MAX_ENTRIES) {
            truncated=true;
            break;
        }
        names[n]=strdup(ent->d_name);
        if(!names[n])break;
        n++;
    }
    qsort(names,n,sizeof *names,entry_compare);
    J *entries=arr();
    for(size_t i=0;i<n;i++) {
        struct stat st;
        if(fstatat(fd,names[i],&st,AT_SYMLINK_NOFOLLOW)==0) {
            J *e=obj();
            str(e,"name",names[i]);
            str(e,"kind",S_ISREG(st.st_mode)?"file":S_ISDIR(st.st_mode)?"directory":S_ISLNK(st.st_mode)?"symlink_denied":"special_denied");
            integer(e,"bytes",st.st_size);
            json_object_array_add(entries,e);
        }
        free(names[i]);
    }
    closedir(dir);
    J *o=obj();
    boolean(o,"ok",true);
    field(o,"entries",entries);
    boolean(o,"truncated",truncated);
    return o;
}
/* No implicit recursion into links, special files or credential directories. */ static void search_walk(int dirfd,const char *prefix,const char *needle,int depth,int *visited,J *matches,bool *truncated) {
    if(depth>8||*visited>=4096||json_object_array_length(matches)>=64) {
        *truncated=true;
        return;
    }
    int dupfd=openat(dirfd,".",O_RDONLY|O_DIRECTORY|O_CLOEXEC);
    if(dupfd<0)return;
    DIR *dir=fdopendir(dupfd);
    if(!dir) {
        close(dupfd);
        return;
    }
    struct dirent *e;
    while((e=readdir(dir))) {
        if(!valid_path(e->d_name,false))continue;
        if(++*visited>4096||json_object_array_length(matches)>=64) {
            *truncated=true;
            break;
        }
        char path[PATH_MAX];
        int z=snprintf(path,sizeof path,"%s%s%s",prefix,*prefix?"/":"",e->d_name);
        if(z<0||(size_t)z>=sizeof path)continue;
        struct stat st;
        if(fstatat(dirfd,e->d_name,&st,AT_SYMLINK_NOFOLLOW))continue;
        if(S_ISDIR(st.st_mode)) {
            int child=open_beneath(dirfd,e->d_name,O_RDONLY|O_DIRECTORY,0);
            if(child>=0) {
                search_walk(child,path,needle,depth+1,visited,matches,truncated);
                close(child);
            }
            continue;
        }
        if(!S_ISREG(st.st_mode)||st.st_nlink!=1||st.st_size>65536)continue;
        int fd=open_beneath(dirfd,e->d_name,O_RDONLY|O_NONBLOCK,0);
        if(fd<0)continue;
        size_t n=0;
        unsigned char *data=read_all(fd,&n);
        close(fd);
        if(!data)continue;
        if(utf8(data,n)) {
            const char *match=strstr((char*)data,needle);
            if(match) {
                J *item=obj();
                str(item,"path",path);
                int line=1;
                for(const char *p=(char*)data;p<match;p++)if(*p=='\n')line++;
                integer(item,"line",line);
                json_object_array_add(matches,item);
            }
        }
        free(data);
    }
    closedir(dir);
}
static J *search_files(J *args) {
    const char *q=text(args,"query");
    if(!q||!*q||strlen(q)>256)return failure("QUERY_LIMIT_OR_INVALID");
    J *matches=arr();
    int visited=0;
    bool truncated=false;
    search_walk(root_fd,"",q,0,&visited,matches,&truncated);
    J *o=obj();
    boolean(o,"ok",true);
    field(o,"matches",matches);
    integer(o,"files_examined",visited);
    boolean(o,"truncated",truncated);
    return o;
}
static J *run_command(J *args) {
    if(!commands_allowed)return failure("TRUSTED_COMMAND_PERMISSION_REQUIRED");
    if(getuid()==0)return failure("REFUSE_ROOT_COMMAND_EXECUTION");
    const char *command=text(args,"command");
    int64_t timeout=number(args,"timeout_ms",30000);
    if(!command||!*command||strlen(command)>8192||timeout<100||timeout>120000)return failure("COMMAND_LIMIT_OR_INVALID");
    int pipes[2];
    if(pipe2(pipes,O_CLOEXEC))return failure("PIPE_FAILED");
    pid_t child=fork();
    if(child<0) {
        close(pipes[0]);
        close(pipes[1]);
        return failure("FORK_FAILED");
    }
    if(child==0) {
        setpgid(0,0);
        prctl(PR_SET_PDEATHSIG,SIGKILL);
        if(getppid()==1)_exit(126);
        if(fchdir(root_fd))_exit(126);
        int zero=open("/dev/null",O_RDONLY);
        if(zero<0||dup2(zero,0)<0||dup2(pipes[1],1)<0||dup2(pipes[1],2)<0)_exit(126);
        struct rlimit cpu= {
            .rlim_cur=120,.rlim_max=120
        },mem= {
            .rlim_cur=2147483648ULL,.rlim_max=2147483648ULL
        },fds= {
            .rlim_cur=128,.rlim_max=128
        },file= {
            .rlim_cur=67108864,.rlim_max=67108864
        },core= {
            0,0
        };
        if(setrlimit(RLIMIT_CPU,&cpu)||setrlimit(RLIMIT_AS,&mem)||setrlimit(RLIMIT_NOFILE,&fds)||setrlimit(RLIMIT_FSIZE,&file)||setrlimit(RLIMIT_CORE,&core))_exit(126);
        if(prctl(PR_SET_NO_NEW_PRIVS,1,0,0,0))_exit(126);
        if(syscall(SYS_close_range,3,UINT_MAX,0))_exit(126);
        char *argv[]= {
            "sh","-c",(char*)command,NULL
        };
        char home[PATH_MAX+6];
        snprintf(home,sizeof home,"HOME=%s",workspace);
        char *envp[]= {
            "PATH=/usr/bin:/bin","LANG=C.UTF-8","LC_ALL=C.UTF-8",home,NULL
        };
        execve("/bin/sh",argv,envp);
        _exit(127);
    }
    active_child=child;
    setpgid(child,child);
    close(pipes[1]);
    fcntl(pipes[0],F_SETFL,O_NONBLOCK);
    uint64_t deadline=now_ms()+(uint64_t)timeout;
    char output[MAX_OUTPUT+1];
    size_t used=0;
    bool timed_out=false,limited=false,eof=false,done=false;
    call_cancelled=false;
    int status=0;
    while(!eof||!done) {
        if(interrupted)call_cancelled=true;
        if(now_ms()>=deadline)timed_out=true;
        if(timed_out||call_cancelled)kill(-child,SIGKILL);
        struct pollfd p[2]={{.fd=pipes[0],.events=POLLIN|POLLHUP},{.fd=0,.events=POLLIN|POLLHUP}};
        poll(p,2,20);
        if(p[1].revents&(POLLIN|POLLHUP|POLLERR))read_during_command();
        if(call_cancelled||interrupted){call_cancelled=true;kill(-child,SIGKILL);}
        char chunk[4096];
        ssize_t n;
        while((n=read(pipes[0],chunk,sizeof chunk))>0) {
            size_t copy=(size_t)n;
            if(copy>MAX_OUTPUT-used) {
                copy=MAX_OUTPUT-used;
                limited=true;
            }
            memcpy(output+used,chunk,copy);
            used+=copy;
            if(limited)kill(-child,SIGKILL);
        }
        if(n==0)eof=true;
        if(n<0&&errno!=EAGAIN&&errno!=EINTR)eof=true;
        if(!done) {
            pid_t waited=waitpid(child,&status,WNOHANG);
            if(waited==child) {
                done=true;
                kill(-child,SIGKILL);
            }
            else if(waited<0&&errno!=EINTR) {
                done=true;
                kill(-child,SIGKILL);
            }
        }
        if(timed_out||limited||call_cancelled) {
            if(!done) {
                while(waitpid(child,&status,0)<0&&errno==EINTR) {
                }
                done=true;
            }
            break;
        }
    }
    kill(-child,SIGKILL);
    active_child=0;
    close(pipes[0]);
    output[used]=0;
    J *o=obj();
    boolean(o,"ok",!timed_out&&!limited&&!call_cancelled&&WIFEXITED(status)&&WEXITSTATUS(status)==0);
    boolean(o,"cancelled",call_cancelled);
    boolean(o,"timed_out",timed_out);
    boolean(o,"output_limited",limited);
    integer(o,"exit_code",WIFEXITED(status)?WEXITSTATUS(status):-1);
    integer(o,"signal",WIFSIGNALED(status)?WTERMSIG(status):0);
    if(utf8((unsigned char*)output,used))field(o,"output",json_object_new_string_len(output,(int)used));
    else str(o,"output","[non-UTF-8 command output omitted]");
    str(o,"scope","trusted_user_process_not_os_sandboxed");
    return o;
}
typedef J *(*ToolFn)(J*);
struct Tool  {
    const char *name,*description,*schema;
    ToolFn fn;
    bool read_only;
    bool mutates;
    bool command;
};
static const struct Tool tools[]= {
    {
        "list_directory","List a workspace directory. Links are shown as denied; secrets and private trash are omitted.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"}},\"additionalProperties\":false}",list_directory,true,false,false
    },  {
        "read_file","Read bounded UTF-8 text inside the workspace. Returns the real SHA-256 required by edits.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"},\"offset\":{\"type\":\"integer\",\"minimum\":0},\"length\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":16000}},\"required\":[\"path\"],\"additionalProperties\":false}",read_file,true,false,false
    },  {
        "search_files","Search literal UTF-8 text in workspace files. Bounded recursion, no links or credential files.","{\"type\":\"object\",\"properties\":{\"query\":{\"type\":\"string\",\"maxLength\":256}},\"required\":[\"query\"],\"additionalProperties\":false}",search_files,true,false,false
    },  {
        "write_file","Create or replace a workspace text file atomically. Existing files require their expected SHA-256.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"},\"text\":{\"type\":\"string\",\"maxLength\":16000},\"expected_sha256\":{\"type\":\"string\",\"pattern\":\"^[a-f0-9]{64}$\"}},\"required\":[\"path\",\"text\"],\"additionalProperties\":false}",write_file,false,true,false
    },  {
        "edit_file","Replace exactly one matching text segment. Requires SHA-256 of the file read by the client.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"},\"old_text\":{\"type\":\"string\"},\"new_text\":{\"type\":\"string\"},\"expected_sha256\":{\"type\":\"string\",\"pattern\":\"^[a-f0-9]{64}$\"}},\"required\":[\"path\",\"old_text\",\"new_text\",\"expected_sha256\"],\"additionalProperties\":false}",edit_file,false,true,false
    },  {
        "create_directory","Create one workspace directory. Parent must already exist.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"}},\"required\":[\"path\"],\"additionalProperties\":false}",create_directory,false,true,false
    },  {
        "move_file","Move a regular file within the workspace, without overwriting the destination.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"},\"destination\":{\"type\":\"string\"},\"expected_sha256\":{\"type\":\"string\",\"pattern\":\"^[a-f0-9]{64}$\"}},\"required\":[\"path\",\"destination\",\"expected_sha256\"],\"additionalProperties\":false}",move_file,false,true,false
    },  {
        "delete_file","Remove a regular file by moving it to private workspace trash. Requires confirm=true and its SHA-256; never recursively deletes.","{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"},\"expected_sha256\":{\"type\":\"string\",\"pattern\":\"^[a-f0-9]{64}$\"},\"confirm\":{\"type\":\"boolean\",\"const\":true}},\"required\":[\"path\",\"expected_sha256\",\"confirm\"],\"additionalProperties\":false}",delete_file,false,true,false
    },  {
        "run_command","Run /bin/sh in the workspace as the current user with bounded time/output. NOT OS-sandboxed: separately authorized trusted commands can access the user's other files. No root execution.","{\"type\":\"object\",\"properties\":{\"command\":{\"type\":\"string\",\"maxLength\":8192},\"timeout_ms\":{\"type\":\"integer\",\"minimum\":100,\"maximum\":120000}},\"required\":[\"command\"],\"additionalProperties\":false}",run_command,false,false,true
    }
};
static bool tool_visible(const struct Tool *t) {
    return (!t->mutates||writes_allowed)&&(!t->command||commands_allowed);
}
static bool validate_args(J *args,J *schema) {
    if(!args||json_object_get_type(args)!=json_type_object)return false;
    J *properties=get(schema,"properties"),*required=get(schema,"required");
    if(required)for(size_t i=0;i<json_object_array_length(required);i++)if(!get(args,json_object_get_string(json_object_array_get_idx(required,i))))return false;
    json_object_object_foreach(args,k,v) {
        J *rule=get(properties,k);
        if(!rule)return false;
        const char *type=text(rule,"type");
        enum json_type actual=json_object_get_type(v);
        if(!type)return false;
        if(!strcmp(type,"string")) {
            if(actual!=json_type_string||!text(args,k))return false;
            int64_t max=number(rule,"maxLength",MAX_FRAME);
            if(json_object_get_string_len(v)>max)return false;
        }
        else if(!strcmp(type,"integer")) {
            if(actual!=json_type_int)return false;
            int64_t n=json_object_get_int64(v);
            if(n<number(rule,"minimum",INT64_MIN)||n>number(rule,"maximum",INT64_MAX))return false;
        }
        else if(!strcmp(type,"boolean")) {
            if(actual!=json_type_boolean)return false;
        }
        else return false;
        J *constant=get(rule,"const");
        if(constant&&!json_object_equal(constant,v))return false;
    }
    return true;
}
static void bound_result(J *data)  {
    /* A complete result must fit the application's 20-KiB MCP result budget,
    * including legacy JSON-string escaping. Truncation is always explicit. */ const size_t cap=7600;
    const char *key=get(data,"text")?"text":get(data,"output")?"output":NULL;
    while(strlen(json_object_to_json_string_ext(data,JSON_C_TO_STRING_PLAIN))>cap)  {
        if(key)  {
            const char *value=text(data,key);
            if(!value||!*value)break;
            size_t n=strlen(value)/2;
            while(n&&(value[n]&0xc0)==0x80)n--;
            J *shorter=json_object_new_string_len(value,(int)n);
            if(!strcmp(key,"text"))  {
                int64_t previous=number(data,"next_offset",0);
                integer(data,"next_offset",previous-(int64_t)(strlen(value)-n));
                boolean(data,"truncated",true);
            }
            else boolean(data,"output_limited",true);
            field(data,key,shorter);
        }
        else  {
            J *items=get(data,"entries");
            if(!items)items=get(data,"matches");
            if(!items||json_object_get_type(items)!=json_type_array||!json_object_array_length(items))break;
            size_t n=json_object_array_length(items);
            json_object_array_del_idx(items,n-1,1);
            boolean(data,"truncated",true);
        }
    }
}
static J *server_info(void) {
    J *s=obj();
    str(s,"name","codemax-local-tools");
    str(s,"version",VERSION);
    return s;
}
static J *capabilities(void) {
    J *c=obj(),*t=obj();
    boolean(t,"listChanged",false);
    field(c,"tools",t);
    return c;
}
static void complete_meta(J *result,bool latest) {
    if(!latest)return;
    str(result,"resultType","complete");
    J *m=obj();
    field(m,"io.modelcontextprotocol/serverInfo",server_info());
    field(result,"_meta",m);
}
static J *rpc_error(J *id,int code,const char *message) {
    J *r=obj();
    str(r,"jsonrpc","2.0");
    field(r,"id",id?json_object_get(id):NULL);
    J *e=obj();
    integer(e,"code",code);
    str(e,"message",message);
    field(r,"error",e);
    return r;
}
static J *version_error(J *id,const char *requested) {
    J *r=rpc_error(id,-32022,"Unsupported protocol version"),*data=obj(),*versions=arr();
    json_object_array_add(versions,json_object_new_string(MCP_CURRENT));
    field(data,"supported",versions);str(data,"requested",requested);
    field(get(r,"error"),"data",data);return r;
}
static bool valid_id(J *id) {
    return id&&(json_object_get_type(id)==json_type_int||(json_object_get_type(id)==json_type_string&&json_object_get_string_len(id)<=128&&strlen(json_object_get_string(id))==(size_t)json_object_get_string_len(id)));
}
static J *dispatch(J *request) {
    J *id=get(request,"id"),*params=get(request,"params");
    const char *method=text(request,"method"),*v=text(get(params,"_meta"),"io.modelcontextprotocol/protocolVersion");
    if(!text(request,"jsonrpc")||strcmp(text(request,"jsonrpc"),"2.0")||!method||(id&&!valid_id(id)))return rpc_error(NULL,-32600,"Invalid Request");
    if(!id) {
        if(!strcmp(method,"notifications/initialized") && legacy_pending) {
            legacy_initialized=true;
            legacy_pending=false;
        }
        return NULL;
    }
    bool latest=v&&!strcmp(v,MCP_CURRENT);
    bool discover=!strcmp(method,"server/discover"),init=!strcmp(method,"initialize");
    if(get(get(params,"_meta"),"io.modelcontextprotocol/protocolVersion")&&!v)return rpc_error(id,-32602,"Protocol version must be a string");
    if(v&&!latest)return version_error(id,v);
    if(discover&&!latest)return rpc_error(id,-32602,"Discovery requires current request metadata");
    if(init&&latest)return rpc_error(id,-32601,"Modern MCP does not use initialize");
    if(latest && (!get(get(params,"_meta"),"io.modelcontextprotocol/clientCapabilities") || json_object_get_type(get(get(params,"_meta"),"io.modelcontextprotocol/clientCapabilities"))!=json_type_object))
        return rpc_error(id,-32602,"Current requests require clientCapabilities metadata");
    if(!latest&&!legacy_initialized&&!discover&&!init)return rpc_error(id,-32022,"Include current protocol metadata or initialize a legacy session");
    J *result=NULL;
    if(discover) {
        result=obj();
        J *versions=arr();
        json_object_array_add(versions,json_object_new_string(MCP_CURRENT));
        field(result,"supportedVersions",versions);
        field(result,"capabilities",capabilities());
        integer(result,"ttlMs",30000);
        str(result,"cacheScope","private");
        latest=true;
    }
    else if(init) {
        const char *requested=text(params,"protocolVersion");
        if(!requested||strcmp(requested,"2025-11-25"))return rpc_error(id,-32022,"Supported legacy version is 2025-11-25");
        legacy_pending=true;
        result=obj();
        str(result,"protocolVersion","2025-11-25");
        field(result,"capabilities",capabilities());
        field(result,"serverInfo",server_info());
    }
    else if(!strcmp(method,"ping")&&!latest)result=obj();
    else if(!strcmp(method,"tools/list")) {
        if(get(params,"cursor"))return rpc_error(id,-32602,"This catalog has no continuation cursor");
        result=obj();
        J *list=arr();
        for(size_t i=0;i<sizeof tools/sizeof *tools;i++)if(tool_visible(&tools[i])) {
            J *tool=obj();
            str(tool,"name",tools[i].name);
            str(tool,"description",tools[i].description);
            field(tool,"inputSchema",json_tokener_parse(tools[i].schema));
            J *annotations=obj();
            boolean(annotations,"readOnlyHint",tools[i].read_only);
            boolean(annotations,"destructiveHint",!tools[i].read_only);
            boolean(annotations,"openWorldHint",tools[i].command);
            field(tool,"annotations",annotations);
            json_object_array_add(list,tool);
        }
        field(result,"tools",list);
        if(latest) {
            integer(result,"ttlMs",30000);
            str(result,"cacheScope","private");
        }
    }
    else if(!strcmp(method,"tools/call")) {
        if(get(params,"inputResponses")||get(params,"requestState"))return rpc_error(id,-32602,"This server does not issue multi-round input requests");
        const char *name=text(params,"name");
        J *args=get(params,"arguments");
        if(!args && params && json_object_get_type(params)==json_type_object){args=obj();field(params,"arguments",args);}
        const struct Tool *chosen=NULL;
        for(size_t i=0;i<sizeof tools/sizeof *tools;i++)if(name&&!strcmp(tools[i].name,name)&&tool_visible(&tools[i]))chosen=&tools[i];
        if(!chosen)return rpc_error(id,-32602,"Tool not available under the process grant");
        J *schema=json_tokener_parse(chosen->schema);
        bool valid=validate_args(args,schema);
        json_object_put(schema);
        if(!valid)return rpc_error(id,-32602,"Arguments do not match the tool schema");
        active_request_id=id;
        J *data=chosen->fn(args);
        active_request_id=NULL;
        bound_result(data);
        result=obj();
        J *content=arr(),*entry=obj();
        str(entry,"type","text");
        if(latest)  {
            field(result,"structuredContent",json_object_get(data));
            str(entry,"text",truth(data,"ok")?"Tool completed. Exact output and truncation information are in structuredContent.":"Tool did not succeed. See structuredContent; do not assume the operation completed.");
        }
        else str(entry,"text",json_object_to_json_string_ext(data,JSON_C_TO_STRING_PLAIN));
        json_object_array_add(content,entry);
        field(result,"content",content);
        boolean(result,"isError",!truth(data,"ok"));
        json_object_put(data);
    }
    else return rpc_error(id,-32601,"Method not supported");
    complete_meta(result,latest);
    J *r=obj();
    str(r,"jsonrpc","2.0");
    field(r,"id",json_object_get(id));
    field(r,"result",result);
    return r;
}
/* Reject duplicate JSON object keys before json-c can normalize them. */ static bool unique_keys(const char *s,size_t len) {
    struct Frame  {
        bool object;
        char *keys[128];
        size_t count;
    }
    stack[64];
    memset(stack,0,sizeof stack);
    int depth=-1;
    bool ok=true;
    for(size_t i=0;i<len&&ok;i++) {
        char c=s[i];
        if(c=='{'||c=='[') {
            if(++depth>=64) {
                ok=false;
                break;
            }
            stack[depth].object=c=='{';
        }
        else if(c=='}'||c==']') {
            if(depth<0) {
                ok=false;
                break;
            }
            for(size_t k=0;k<stack[depth].count;k++)free(stack[depth].keys[k]);
            stack[depth].count=0;
            depth--;
        }
        else if(c=='"') {
            size_t start=i++;
            while(i<len) {
                if(s[i]=='\\') {
                    i+=2;
                    continue;
                }
                if(s[i]=='"')break;
                i++;
            }
            if(i>=len) {
                ok=false;
                break;
            }
            size_t q=i+1;
            while(q<len&&(s[q]==' '||s[q]=='\t'||s[q]=='\r'||s[q]=='\n'))q++;
            if(q<len&&s[q]==':'&&depth>=0&&stack[depth].object) {
                if(i-start>1024||stack[depth].count>=128) {
                    ok=false;
                    break;
                }
                char keybuf[1026];
                memcpy(keybuf,s+start,i-start+1);
                keybuf[i-start+1]=0;
                J *j=json_tokener_parse(keybuf);
                if(!j||json_object_get_type(j)!=json_type_string) {
                    if(j)json_object_put(j);
                    ok=false;
                    break;
                }
                const char *key=json_object_get_string(j);
                if(strlen(key)!=(size_t)json_object_get_string_len(j)) {
                    json_object_put(j);
                    ok=false;
                    break;
                }
                for(size_t k=0;k<stack[depth].count;k++)if(!strcmp(stack[depth].keys[k],key))ok=false;
                if(ok) {
                    char *copy=strdup(key);
                    if(!copy)ok=false;
                    else stack[depth].keys[stack[depth].count++]=copy;
                }
                json_object_put(j);
            }
        }
    }
    if(depth>=64)depth=63;
    for(int d=0;d<=depth;d++)for(size_t k=0;k<stack[d].count;k++)free(stack[d].keys[k]);
    return ok;
}
static void process_line(char *line,size_t n) {
    if(n&&line[n-1]=='\r')line[--n]=0;
    J *request=NULL,*response=NULL;
    struct json_tokener *tok=json_tokener_new_ex(64);
    if(!tok)exit(70);
    json_tokener_set_flags(tok,JSON_TOKENER_STRICT|JSON_TOKENER_VALIDATE_UTF8);
    if(n&&unique_keys(line,n)) {
        request=json_tokener_parse_ex(tok,line,(int)n);
        if(json_tokener_get_error(tok)!=json_tokener_success||json_tokener_get_parse_end(tok)!=n) {
            if(request)json_object_put(request);
            request=NULL;
        }
    }
    if(!request)response=rpc_error(NULL,-32700,"Invalid or duplicate-key JSON");
    else if(json_object_get_type(request)!=json_type_object)response=rpc_error(NULL,-32600,"Request object required");
    else response=dispatch(request);
    if(response) {
        const char *json=json_object_to_json_string_ext(response,JSON_C_TO_STRING_PLAIN);
        if(strlen(json)>=MAX_FRAME) {
            json_object_put(response);
            response=rpc_error(request?get(request,"id"):NULL,-32000,"Response exceeds transport limit");
            json=json_object_to_json_string_ext(response,JSON_C_TO_STRING_PLAIN);
        }
        if(!write_all(1,(const unsigned char*)json,strlen(json))||!write_all(1,(const unsigned char*)"\n",1))interrupted=1;
        json_object_put(response);
    }
    if(request)json_object_put(request);
    json_tokener_free(tok);
}
/* Only cancellation is processed while a command runs. Other complete frames
 * are queued and dispatched after the tool result, preserving serial effects
 * and non-interleaved stdout. The queue and partial frame are bounded. */
static bool cancellation_frame(char *line,size_t n) {
    if(!unique_keys(line,n))return false;
    struct json_tokener *tok=json_tokener_new_ex(64);if(!tok)return false;
    json_tokener_set_flags(tok,JSON_TOKENER_STRICT|JSON_TOKENER_VALIDATE_UTF8);
    J *j=json_tokener_parse_ex(tok,line,(int)n);
    bool parsed=j&&json_tokener_get_error(tok)==json_tokener_success&&json_tokener_get_parse_end(tok)==n;
    bool cancelled=parsed&&text(j,"jsonrpc")&&!strcmp(text(j,"jsonrpc"),"2.0")&&
        text(j,"method")&&!strcmp(text(j,"method"),"notifications/cancelled")&&!get(j,"id");
    if(cancelled&&active_request_id&&json_object_equal(get(get(j,"params"),"requestId"),active_request_id))call_cancelled=true;
    if(j)json_object_put(j);
    json_tokener_free(tok);return cancelled;
}
static void read_during_command(void) {
    unsigned char c;ssize_t n=read(0,&c,1);
    if(n<0&&errno==EINTR)return;
    if(n<=0){interrupted=1;return;}
    if(c=='\n'){
        input_line[input_used]=0;
        if(!cancellation_frame(input_line,input_used)){
            if(deferred_count==8){interrupted=1;input_used=0;return;}
            deferred[deferred_count]=strdup(input_line);
            if(!deferred[deferred_count]){interrupted=1;input_used=0;return;}
            deferred_count++;
        }
        input_used=0;
    }else if(input_used==MAX_FRAME||c==0){interrupted=1;}
    else input_line[input_used++]=(char)c;
}
int main(int argc,char **argv) {
    const char *root=NULL;
    for(int i=1;i<argc;i++) {
        if(!strcmp(argv[i],"--workspace")&&i+1<argc)root=argv[++i];
        else if(!strcmp(argv[i],"--allow-write"))writes_allowed=true;
        else if(!strcmp(argv[i],"--allow-trusted-commands"))commands_allowed=true;
        else if(!strcmp(argv[i],"--version")) {
            puts("codemax-local-tools " VERSION " MCP " MCP_CURRENT);
            return 0;
        }
        else {
            fputs("Usage: codemax-local-tools --workspace /absolute/project [--allow-write] [--allow-trusted-commands]\n",stderr);
            return 64;
        }
    }
    if(!root||root[0]!='/'||!realpath(root,workspace)||strcmp(root,workspace)||!strcmp(root,"/")||!strcmp(root,"/etc")||!strcmp(root,"/usr")||!strcmp(root,"/home")||(getenv("HOME")&&!strcmp(root,getenv("HOME")))) {
        fputs("An explicit canonical project directory is required; home/system roots are refused.\n",stderr);
        return 64;
    }
    root_fd=open(root,O_RDONLY|O_DIRECTORY|O_NOFOLLOW|O_CLOEXEC);
    struct stat st;
    if(root_fd<0||fstat(root_fd,&st)||st.st_uid!=getuid()||(st.st_mode&0022)) {
        fputs("Workspace must be owned by this user and not writable by group/others.\n",stderr);
        if(root_fd>=0)close(root_fd);
        return 77;
    }
    int probe=open_beneath(root_fd,".",O_RDONLY|O_DIRECTORY,0);
    if(probe<0) {
        fputs("Kernel openat2 containment is required; no unsafe fallback.\n",stderr);
        close(root_fd);
        return 77;
    }
    close(probe);
    umask(0077);
    struct sigaction sa= {
        .sa_handler=on_signal
    };
    sigemptyset(&sa.sa_mask);
    sigaction(SIGTERM,&sa,NULL);
    sigaction(SIGINT,&sa,NULL);
    signal(SIGPIPE,SIG_IGN);
    input_line=malloc(MAX_FRAME+1);
    if(!input_line){close(root_fd);return 70;}
    while(!interrupted){
        if(deferred_count){
            char *line=deferred[0];
            for(size_t i=1;i<deferred_count;i++)deferred[i-1]=deferred[i];
            deferred_count--;process_line(line,strlen(line));free(line);continue;
        }
        // Single-byte admission intentionally avoids prefetching a cancellation
        // into the main loop while a blocking tool is executing.
        unsigned char c;ssize_t n=read(0,&c,1);
        if(n<0&&errno==EINTR)continue;
        if(n<=0)break;
        if(c=='\n'){
            input_line[input_used]=0;size_t length=input_used;input_used=0;
            process_line(input_line,length);
        }else if(input_used==MAX_FRAME||c==0){
            fputs("Invalid/oversized input frame.\n",stderr);interrupted=1;
        }else input_line[input_used++]=(char)c;
    }
    if(active_child>0)kill(-active_child,SIGKILL);
    for(size_t i=0;i<deferred_count;i++)free(deferred[i]);
    free(input_line);close(root_fd);
    return interrupted||input_used?65:0;
}
