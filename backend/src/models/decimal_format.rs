use rust_decimal::Decimal;
use serde::Serializer;

/// Normalize a Decimal: strip trailing zeros but keep at least 2 decimal places.
/// e.g. 100.00000000 -> "100.00", 0.00123000 -> "0.00123", 1.50000 -> "1.50"
fn format_decimal(d: &Decimal) -> String {
    let normalized = d.normalize();
    let s = normalized.to_string();
    // Find decimal point
    if let Some(dot) = s.find('.') {
        let decimals = s.len() - dot - 1;
        if decimals < 2 {
            // Pad to at least 2 decimal places
            format!("{:.2}", normalized)
        } else {
            // Already has enough meaningful decimals, use normalized form
            s
        }
    } else {
        // No decimal point — add .00
        format!("{}.00", s)
    }
}

pub fn serialize<S: Serializer>(value: &Decimal, serializer: S) -> Result<S::Ok, S::Error> {
    serializer.serialize_str(&format_decimal(value))
}

pub mod option {
    use rust_decimal::Decimal;
    use serde::Serializer;

    pub fn serialize<S: Serializer>(value: &Option<Decimal>, serializer: S) -> Result<S::Ok, S::Error> {
        match value {
            Some(d) => serializer.serialize_str(&super::format_decimal(d)),
            None => serializer.serialize_none(),
        }
    }
}
