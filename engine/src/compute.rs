use crate::models::{BuildInput, ComputedOutput};

const WAFER_DIAMETER: f64 = 300.0;

/// Geometric approximation of Dies Per Wafer (DPW) on a 300mm wafer.
pub fn calculate_dpw(area: f64) -> u32 {
    if area <= 0.0 {
        return 0;
    }
    let term1 = std::f64::consts::PI * WAFER_DIAMETER.powi(2) / (4.0 * area);
    let term2 = std::f64::consts::PI * WAFER_DIAMETER / (2.0_f64 * area).sqrt();
    (term1 - term2).max(1.0).floor() as u32
}

/// Murphy's Yield Model: Y = ((1 - e^(-A * D0)) / (A * D0))^2
/// D0 should be in defects/mm² (input D0 in defects/cm² divided by 100).
pub fn calculate_murphy_yield(area: f64, d0_cm2: f64) -> f64 {
    let d0 = d0_cm2 / 100.0;
    let ad0 = area * d0;
    if ad0 <= 0.0 {
        return 1.0;
    }
    let term = (1.0 - (-ad0).exp()) / ad0;
    term.powi(2)
}

pub fn compute_build_metrics(build: &BuildInput) -> ComputedOutput {
    let is_chiplet = build.topology == "chiplet";

    let total_die_area = if is_chiplet {
        (build.die_area * build.chiplet_count as f64) + build.io_die_area
    } else {
        build.die_area
    };

    let dpw = calculate_dpw(total_die_area);

    let die_yield = if is_chiplet {
        let core_yield = calculate_murphy_yield(build.die_area, build.defect_density);
        let io_yield = calculate_murphy_yield(build.io_die_area, build.defect_density);
        let silicon_yield = core_yield.powi(build.chiplet_count as i32) * io_yield;
        let pkg_assembly_yield = build.packaging_yield / 100.0;
        silicon_yield * pkg_assembly_yield
    } else {
        calculate_murphy_yield(build.die_area, build.defect_density)
    };

    let wafer_area = std::f64::consts::PI * (WAFER_DIAMETER / 2.0).powi(2);
    let wafer_utilization = ((dpw as f64) * total_die_area / wafer_area * 100.0).min(98.0);

    let transistor_density = if total_die_area > 0.0 {
        build.transistor_count * 1000.0 / total_die_area
    } else {
        0.0
    };

    let tdp_power_density = if total_die_area > 0.0 {
        build.tdp / total_die_area
    } else {
        0.0
    };

    let pkg_yield_fraction = build.packaging_yield / 100.0;
    let test_yield_fraction = build.test_yield / 100.0;

    let effective_yield = if is_chiplet {
        die_yield * test_yield_fraction
    } else {
        die_yield * pkg_yield_fraction * test_yield_fraction
    };

    let raw_die_cost = if is_chiplet {
        let core_yield = calculate_murphy_yield(build.die_area, build.defect_density);
        let core_dpw = calculate_dpw(build.die_area);
        let core_cost = build.wafer_cost / ((core_dpw as f64) * core_yield).max(1.0);

        let io_yield = calculate_murphy_yield(build.io_die_area, build.defect_density);
        let io_dpw = calculate_dpw(build.io_die_area);
        let io_cost = build.wafer_cost / ((io_dpw as f64) * io_yield).max(1.0);

        (core_cost * build.chiplet_count as f64) + io_cost
    } else {
        build.wafer_cost / ((dpw as f64) * die_yield).max(1.0)
    };

    let packaging_and_testing_cost =
        build.packaging_cost + (build.test_time_seconds * build.test_cost_per_second);

    let gross_cost_per_good_die =
        (raw_die_cost + packaging_and_testing_cost) / test_yield_fraction;

    let amortized_nre_cost = if build.target_volume > 0.0 {
        (build.nre_cost * 1_000_000.0) / (build.target_volume * 1_000_000.0)
    } else {
        0.0
    };

    let fully_loaded_cost_per_die = gross_cost_per_good_die + amortized_nre_cost;

    let gross_margin = if build.asp > 0.0 {
        ((build.asp - gross_cost_per_good_die) / build.asp) * 100.0
    } else {
        0.0
    };

    let operating_margin = if build.asp > 0.0 {
        ((build.asp - fully_loaded_cost_per_die) / build.asp) * 100.0
    } else {
        0.0
    };

    let good_dies_per_wafer = (dpw as f64) * effective_yield;
    let monthly_good_chips = good_dies_per_wafer * build.wafer_starts_per_month as f64;
    let monthly_volume_million = monthly_good_chips / 1_000_000.0;
    let annual_volume_million = monthly_volume_million * 12.0;

    let lifetime_revenue_million = build.target_volume * build.asp;
    let lifetime_cogs_million = build.target_volume * gross_cost_per_good_die;
    let lifetime_gross_profit_million = lifetime_revenue_million - lifetime_cogs_million;
    let lifetime_net_profit_million = lifetime_gross_profit_million - build.nre_cost;

    let margin_per_unit = build.asp - gross_cost_per_good_die;
    let break_even_volume_million = if margin_per_unit > 0.0 {
        build.nre_cost / margin_per_unit
    } else {
        0.0
    };

    let roi = if build.nre_cost > 0.0 {
        (lifetime_net_profit_million / build.nre_cost) * 100.0
    } else {
        0.0
    };

    ComputedOutput {
        total_die_area,
        transistor_density,
        tdp_power_density,
        die_yield,
        dpw,
        wafer_utilization,
        raw_die_cost,
        packaging_and_testing_cost,
        gross_cost_per_good_die,
        amortized_nre_cost,
        fully_loaded_cost_per_die,
        gross_margin,
        operating_margin,
        monthly_volume_million,
        annual_volume_million,
        lifetime_revenue_million,
        lifetime_cogs_million,
        lifetime_gross_profit_million,
        lifetime_net_profit_million,
        break_even_volume_million,
        roi,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::BuildInput;

    fn test_build() -> BuildInput {
        BuildInput {
            process_node: "5nm".into(),
            die_area: 260.0,
            die_width: 16.1,
            die_height: 16.1,
            transistor_count: 22.4,
            tdp: 45.0,
            topology: "monolithic".into(),
            chiplet_count: 1,
            io_die_area: 0.0,
            defect_density: 0.08,
            wafer_starts_per_month: 8500,
            packaging_cost: 12.50,
            test_time_seconds: 45.0,
            test_cost_per_second: 0.18,
            packaging_yield: 99.2,
            test_yield: 98.5,
            wafer_cost: 9500.0,
            nre_cost: 110.0,
            asp: 285.0,
            target_volume: 4.5,
        }
    }

    #[test]
    fn test_dpw_monolithic() {
        let dpw = calculate_dpw(260.0);
        assert!(dpw > 0, "DPW should be positive for a valid die area");
    }

    #[test]
    fn test_dpw_zero_area() {
        let dpw = calculate_dpw(0.0);
        assert_eq!(dpw, 0, "DPW should be 0 for zero area");
    }

    #[test]
    fn test_murphy_yield_sanity() {
        // At D0=0, yield should be 100%
        let y = calculate_murphy_yield(100.0, 0.0);
        assert!((y - 1.0).abs() < 1e-10, "Zero defect density should yield 100%");
    }

    #[test]
    fn test_murphy_yield_decreasing() {
        // Yield should decrease as defect density increases
        let y1 = calculate_murphy_yield(100.0, 0.05);
        let y2 = calculate_murphy_yield(100.0, 0.10);
        assert!(y1 > y2, "Higher defect density should reduce yield");
    }

    #[test]
    fn test_murphy_yield_bounds() {
        let y = calculate_murphy_yield(100.0, 0.08);
        assert!(y > 0.0 && y <= 1.0, "Yield must be between 0 and 1");
    }

    #[test]
    fn test_compute_build_metrics_executes() {
        let build = test_build();
        let result = compute_build_metrics(&build);
        assert!(result.dpw > 0, "DPW should be computed");
        assert!(result.die_yield > 0.0, "Die yield should be positive");
        assert!(result.gross_margin > 0.0, "Gross margin should be positive");
    }

    #[test]
    fn test_compute_chiplet() {
        let build = BuildInput {
            process_node: "3nm".into(),
            die_area: 145.0,
            die_width: 12.0,
            die_height: 12.0,
            transistor_count: 92.0,
            tdp: 350.0,
            topology: "chiplet".into(),
            chiplet_count: 4,
            io_die_area: 180.0,
            defect_density: 0.12,
            wafer_starts_per_month: 4000,
            packaging_cost: 48.00,
            test_time_seconds: 90.0,
            test_cost_per_second: 0.25,
            packaging_yield: 97.5,
            test_yield: 96.0,
            wafer_cost: 18000.0,
            nre_cost: 260.0,
            asp: 1250.0,
            target_volume: 1.2,
        };
        let result = compute_build_metrics(&build);
        assert!(result.total_die_area > build.die_area, "Chiplet total area should exceed single core area");
        assert!(result.roi > 0.0, "ROI should be positive for a viable build");
    }

    #[test]
    fn test_sensitivity_consistency() {
        // Larger die area should reduce yield
        let small = compute_build_metrics(&BuildInput { die_area: 100.0, ..test_build() });
        let large = compute_build_metrics(&BuildInput { die_area: 400.0, ..test_build() });
        assert!(
            small.die_yield > large.die_yield,
            "Larger die area should reduce yield"
        );
    }

    #[test]
    fn test_financial_chain() {
        let build = test_build();
        let result = compute_build_metrics(&build);
        // Verify financial chain: revenue > COGS > net profit
        assert!(result.lifetime_revenue_million > result.lifetime_cogs_million);
        assert!(result.lifetime_gross_profit_million > result.lifetime_net_profit_million);
    }
}
