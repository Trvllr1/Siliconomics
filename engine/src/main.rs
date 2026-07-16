use std::io::{self, Read};
use siliconomics_engine::{compute_build_metrics, BuildInput};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).expect("Failed to read stdin");

    let build: BuildInput = serde_json::from_str(&input).expect("Invalid JSON input");

    let result = compute_build_metrics(&build);

    let output = serde_json::to_string_pretty(&result).expect("Failed to serialize output");
    println!("{output}");
}
