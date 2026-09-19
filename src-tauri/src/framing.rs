//! Bounded byte framing before UTF-8/JSON decoding. Never read an unbounded line.
pub const MAX_FRAME: usize = 1_048_576;
#[derive(Default)]
pub struct Frames { pending: Vec<u8> }
impl Frames {
    pub fn push(&mut self, bytes: &[u8]) -> Result<Vec<Vec<u8>>, &'static str> {
        let mut frames = Vec::new();
        for &byte in bytes {
            if byte == b'\n' {
                if self.pending.is_empty() { continue; }
                frames.push(std::mem::take(&mut self.pending));
                if frames.len() > 256 { return Err("IPC_FRAME_RATE_LIMIT"); }
            } else {
                if self.pending.len() >= MAX_FRAME { return Err("IPC_FRAME_LIMIT"); }
                self.pending.push(byte);
            }
        }
        Ok(frames)
    }
    pub fn is_empty(&self) -> bool { self.pending.is_empty() }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn every_unicode_split() {
        let data = "{\"text\":\"hello 世界\"}\n{\"n\":2}\n".as_bytes();
        for split in 0..=data.len() {
            let mut parser = Frames::default();
            let mut frames = parser.push(&data[..split]).unwrap();
            frames.extend(parser.push(&data[split..]).unwrap());
            assert_eq!(frames.len(), 2);
            for frame in frames { let _: serde_json::Value = serde_json::from_slice(&frame).unwrap(); }
            assert!(parser.is_empty());
        }
    }
    #[test]
    fn oversized_frame_rejected() {
        assert!(Frames::default().push(&vec![b'x'; MAX_FRAME + 1]).is_err());
    }
}
