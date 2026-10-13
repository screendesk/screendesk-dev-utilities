use clap::{Args, Parser, Subcommand};
use har_sanitizer::{sanitize, scan, summarize, Finding, Options, Report};
use serde_json::Value;
use std::fs;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::ExitCode;

/// Redact cookies, tokens, and secrets from HAR files before you share them.
///
/// Runs locally; nothing is uploaded. Prefer the browser? https://screendesk.io/tools/har-file-analyzer
#[derive(Parser)]
#[command(name = "har-sanitizer", version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Write a copy of the HAR with secret values replaced
    Sanitize {
        /// HAR file to read, or - for stdin
        input: PathBuf,
        /// Where to write the sanitized HAR (- for stdout). Default: <input>-sanitized.har, or stdout when reading stdin
        #[arg(short, long)]
        output: Option<PathBuf>,
        /// Write the report as JSON to this path (- for stderr)
        #[arg(long, value_name = "PATH")]
        report: Option<PathBuf>,
        /// Write compact JSON instead of pretty-printed
        #[arg(long)]
        compact: bool,
        /// List every redacted value's location and name
        #[arg(short, long)]
        verbose: bool,
        #[command(flatten)]
        rules: Rules,
    },
    /// Report secrets in a HAR without changing it. Exits with status 1 if any are found
    Scan {
        /// HAR file to read, or - for stdin
        input: PathBuf,
        /// Print the report as JSON
        #[arg(long)]
        json: bool,
        /// Exit 0 even when secrets are found
        #[arg(long)]
        exit_zero: bool,
        #[command(flatten)]
        rules: Rules,
    },
    /// Show request counts, failures, transfer size, and the slowest request
    Summary {
        /// HAR file to read, or - for stdin
        input: PathBuf,
        /// Print the summary as JSON
        #[arg(long)]
        json: bool,
    },
}

#[derive(Args)]
struct Rules {
    /// Remove request and response bodies entirely
    #[arg(long)]
    strip_bodies: bool,
    /// Don't look inside JSON and form bodies for sensitive fields
    #[arg(long)]
    no_body_scan: bool,
    /// Don't replace values that look like JSON Web Tokens
    #[arg(long)]
    keep_jwts: bool,
    /// Also redact this header, cookie, parameter, or field name (repeatable)
    #[arg(long = "redact", value_name = "NAME")]
    redact: Vec<String>,
    /// Never redact this name (repeatable)
    #[arg(long = "allow", value_name = "NAME")]
    allow: Vec<String>,
    /// Replacement text for secret values
    #[arg(long, default_value = "[REDACTED]")]
    placeholder: String,
}

impl Rules {
    fn options(self) -> Options {
        Options {
            placeholder: self.placeholder,
            strip_bodies: self.strip_bodies,
            scan_bodies: !self.no_body_scan,
            redact_jwts: !self.keep_jwts,
            redact_names: self.redact,
            allow_names: self.allow,
        }
    }
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(code) => code,
        Err(message) => {
            eprintln!("har-sanitizer: {message}");
            ExitCode::from(2)
        }
    }
}

fn run(cli: Cli) -> Result<ExitCode, String> {
    match cli.command {
        Command::Sanitize {
            input,
            output,
            report,
            compact,
            verbose,
            rules,
        } => {
            let mut har = read(&input)?;
            let result = sanitize(&mut har, &rules.options())
                .map_err(|e| format!("{}: {e}", input.display()))?;
            let text = if compact {
                serde_json::to_string(&har)
            } else {
                serde_json::to_string_pretty(&har)
            }
            .map_err(|e| e.to_string())?;
            let destination = output.unwrap_or_else(|| default_output(&input));
            write(&destination, &text)?;
            eprintln!("{result}");
            if verbose {
                print_findings(&result);
            }
            if destination != Path::new("-") {
                eprintln!("Wrote {}", destination.display());
            }
            if let Some(path) = report {
                let json = serde_json::to_string_pretty(&result).map_err(|e| e.to_string())?;
                if path == Path::new("-") {
                    eprintln!("{json}");
                } else {
                    write(&path, &json)?;
                }
            }
            Ok(ExitCode::SUCCESS)
        }
        Command::Scan {
            input,
            json,
            exit_zero,
            rules,
        } => {
            let har = read(&input)?;
            let result =
                scan(&har, &rules.options()).map_err(|e| format!("{}: {e}", input.display()))?;
            if json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&result).map_err(|e| e.to_string())?
                );
            } else {
                println!("{}", result.to_string().replacen("Redacted", "Found", 1));
                for finding in &result.findings {
                    println!("{}", finding_line(finding));
                }
            }
            Ok(if result.is_clean() || exit_zero {
                ExitCode::SUCCESS
            } else {
                ExitCode::from(1)
            })
        }
        Command::Summary { input, json } => {
            let har = read(&input)?;
            let summary = summarize(&har).ok_or_else(|| {
                format!(
                    "{}: not a HAR file: missing log.entries array",
                    input.display()
                )
            })?;
            if json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&summary).map_err(|e| e.to_string())?
                );
            } else {
                println!("Requests      {}", summary.requests);
                println!("Domains       {}", summary.domains);
                println!(
                    "Failed        {} (4xx: {}, 5xx: {}, blocked/0: {})",
                    summary.failed, summary.status_4xx, summary.status_5xx, summary.status_0
                );
                println!("Transferred   {}", human_bytes(summary.bytes));
                if let Some(slowest) = summary.slowest {
                    println!(
                        "Slowest       {:.0} ms  {} {} ({})",
                        slowest.time_ms, slowest.method, slowest.url, slowest.status
                    );
                }
            }
            Ok(ExitCode::SUCCESS)
        }
    }
}

fn read(path: &Path) -> Result<Value, String> {
    let text = if path == Path::new("-") {
        let mut buffer = String::new();
        io::stdin()
            .read_to_string(&mut buffer)
            .map_err(|e| format!("stdin: {e}"))?;
        buffer
    } else {
        fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?
    };
    // Some exporters write a UTF-8 byte order mark.
    serde_json::from_str(text.trim_start_matches('\u{feff}'))
        .map_err(|e| format!("{}: not valid JSON: {e}", path.display()))
}

fn write(path: &Path, text: &str) -> Result<(), String> {
    if path == Path::new("-") {
        let mut stdout = io::stdout().lock();
        writeln!(stdout, "{text}").map_err(|e| e.to_string())
    } else {
        fs::write(path, format!("{text}\n")).map_err(|e| format!("{}: {e}", path.display()))
    }
}

fn default_output(input: &Path) -> PathBuf {
    if input == Path::new("-") {
        return PathBuf::from("-");
    }
    let stem = input
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");
    input.with_file_name(format!("{stem}-sanitized.har"))
}

fn print_findings(report: &Report) {
    for finding in &report.findings {
        eprintln!("{}", finding_line(finding));
    }
}

fn finding_line(finding: &Finding) -> String {
    format!(
        "  entry {:>4}  {:<24} {:<16} {}",
        finding.entry,
        finding.location,
        format!("{:?}", finding.kind),
        finding.name
    )
}

fn human_bytes(bytes: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut value = bytes as f64;
    let mut unit = 0;
    while value >= 1024.0 && unit < UNITS.len() - 1 {
        value /= 1024.0;
        unit += 1;
    }
    if unit == 0 {
        format!("{bytes} B")
    } else {
        format!("{value:.1} {}", UNITS[unit])
    }
}
