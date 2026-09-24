fn main() {
    println!("cargo:rerun-if-changed=../browser/agent.js");
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "bridge_request", "provider_observe", "browser_bounds",
                "browser_control", "backend_restart", "host_status",
                "browser_find", "window_control", "document_export", "document_import", "directory_pick", "gateway_probe",
                "browser_list_sources", "browser_site_data", "browser_import_cookies", "browser_fill_login",
            ]),
        ),
    ).expect("Tauri build and permission manifest");
}
