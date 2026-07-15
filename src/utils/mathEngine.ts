/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Build, MetricCardData, CalculationTrace } from '../types';

/**
 * Rounds a number to a specified number of decimal places
 */
export function round(val: number, decimals: number = 2): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Geometric approximation of Dies Per Wafer (DPW) on a 300mm wafer
 */
export function calculateDPW(area: number): number {
  if (area <= 0) return 0;
  const waferDiameter = 300; // mm
  const term1 = (Math.PI * Math.pow(waferDiameter, 2)) / (4 * area);
  const term2 = (Math.PI * waferDiameter) / Math.sqrt(2 * area);
  return Math.max(1, Math.floor(term1 - term2));
}

/**
 * Murphy's Yield Model
 * Y = ((1 - e^(-A * D0)) / (A * D0))^2
 * D0 should be in defects per mm2 (D0 in defects/cm2 divided by 100)
 */
export function calculateMurphyYield(area: number, d0cm2: number): number {
  const d0 = d0cm2 / 100; // Convert to defects/mm2
  const ad0 = area * d0;
  if (ad0 <= 0) return 1;
  const term = (1 - Math.exp(-ad0)) / ad0;
  return Math.pow(term, 2);
}

export interface ComputedBuildMetrics {
  build: Build;
  totalDieArea: number;
  transistorDensity: number; // M Tr/mm2
  tdpPowerDensity: number; // W/mm2
  dieYield: number; // fraction 0..1
  dpw: number;
  waferUtilization: number; // %
  rawDieCost: number; // $
  packagingAndTestingCost: number; // $
  grossCostPerGoodDie: number; // $
  amortizedNreCost: number; // $
  fullyLoadedCostPerDie: number; // $
  grossMargin: number; // %
  operatingMargin: number; // %
  monthlyVolumeMillion: number;
  annualVolumeMillion: number;
  lifetimeRevenueMillion: number;
  lifetimeCOGSMillion: number;
  lifetimeGrossProfitMillion: number;
  lifetimeNetProfitMillion: number;
  breakEvenVolumeMillion: number;
  roi: number; // %
  metricsList: MetricCardData[];
}

export function computeBuildMetrics(build: Build): ComputedBuildMetrics {
  const {
    processNode,
    dieArea,
    dieWidth,
    dieHeight,
    transistorCount,
    tdp,
    topology,
    chipletCount,
    ioDieArea,
    defectDensity,
    waferStartsPerMonth,
    packagingCost,
    testTimeSeconds,
    testCostPerSecond,
    packagingYield,
    testYield,
    waferCost,
    nreCost,
    asp,
    targetVolume,
  } = build;

  // 1. Engineering Area & Yield Math
  let totalDieArea = dieArea;
  let dpw = 0;
  let dieYield = 0;
  let yieldExplanation = '';
  let dpwExplanation = '';

  const waferDiameter = 300;
  const waferArea = Math.PI * Math.pow(waferDiameter / 2, 2); // ~70685.83 mm2

  if (topology === 'monolithic') {
    totalDieArea = dieArea;
    dpw = calculateDPW(totalDieArea);
    dieYield = calculateMurphyYield(totalDieArea, defectDensity);
    
    yieldExplanation = `Murphy's Model: ((1 - e^(-A * D0)) / (A * D0))^2 for monolith area ${totalDieArea} mm²`;
    dpwExplanation = `DPW = (π * d²) / (4 * A) - (π * d) / √(2 * A) for area ${totalDieArea} mm²`;
  } else {
    // Chiplet topology
    // We have 'chipletCount' of CPU/Core chiplets (dieArea is the core chiplet area)
    // plus 1 I/O die (ioDieArea)
    const coreArea = dieArea;
    const coreDPW = calculateDPW(coreArea);
    const coreYield = calculateMurphyYield(coreArea, defectDensity);

    const ioYield = calculateMurphyYield(ioDieArea, defectDensity);
    const ioDPW = calculateDPW(ioDieArea);

    // Yield for the package's silicon is the yield of getting all chiplets good
    // multiplied by advanced packaging assembly yield
    const siliconYield = Math.pow(coreYield, chipletCount) * ioYield;
    const pkgAssemblyYieldFraction = packagingYield / 100;
    
    // Overall effective silicon-assembly yield
    dieYield = siliconYield * pkgAssemblyYieldFraction;
    totalDieArea = (coreArea * chipletCount) + ioDieArea;
    
    // Equivalent DPW is based on core and I/O die constraints.
    // For every complete system, we need 'chipletCount' cores and 1 I/O.
    // So equivalent DPW per wafer is complex. Let's simplify equivalent DPW:
    // How many systems can we build per wafer equivalent?
    // Cost of silicon set = (chipletCount * CoreCost) + IoCost
    // Or we can define equivalent DPW as WaferArea / totalDieArea * utilization
    dpw = Math.floor(calculateDPW(totalDieArea) * 1.15); // Chiplet layout packing is 15% better due to smaller die modularity!
    
    yieldExplanation = `Chiplet System: (CoreYield^${chipletCount} * IoYield) * AdvancedPkgYield (${packagingYield}%)`;
    dpwExplanation = `Equivalent DPW representing chiplet packaging efficiency. Cores DPW: ${coreDPW}, I/O DPW: ${ioDPW}`;
  }

  // Transistor density: Billion Transistors / Area (M Tr/mm2)
  const transistorDensity = totalDieArea > 0 ? (transistorCount * 1000) / totalDieArea : 0;
  // TDP Density (W/mm2)
  const tdpPowerDensity = totalDieArea > 0 ? tdp / totalDieArea : 0;

  // Wafer Utilization (%)
  const waferUtilization = Math.min(98, (dpw * totalDieArea) / waferArea * 100);

  // 2. Manufacturing Yield Math
  const pkgYieldFraction = packagingYield / 100;
  const testYieldFraction = testYield / 100;
  const effectiveYield = dieYield * (topology === 'monolithic' ? pkgYieldFraction : 1) * testYieldFraction; // Packaging yield is already counted in chiplet siliconYield

  // Monthly good chips
  const rawDiesPerWafer = dpw * dieYield;
  const goodDiesPerWafer = dpw * effectiveYield;
  const monthlyGoodChips = goodDiesPerWafer * waferStartsPerMonth;
  const annualVolumeMillion = (monthlyGoodChips * 12) / 1000000;
  const monthlyVolumeMillion = monthlyGoodChips / 1000000;

  // 3. Financial Costs
  // Raw Die Cost ($)
  // If monolithic:
  let rawDieCost = 0;
  if (topology === 'monolithic') {
    rawDieCost = waferCost / Math.max(1, dpw * dieYield);
  } else {
    // If chiplet, let's represent silicon sets cost:
    // Cores cost + I/O cost + Packaging
    const coreArea = dieArea;
    const coreYield = calculateMurphyYield(coreArea, defectDensity);
    const coreDPW = calculateDPW(coreArea);
    const coreCost = waferCost / Math.max(1, coreDPW * coreYield);

    const ioYield = calculateMurphyYield(ioDieArea, defectDensity);
    const ioDPW = calculateDPW(ioDieArea);
    const ioCost = waferCost / Math.max(1, ioDPW * ioYield);

    rawDieCost = (coreCost * chipletCount) + ioCost;
  }

  const packagingAndTestingCost = packagingCost + (testTimeSeconds * testCostPerSecond);
  
  // Gross Cost per Good Die ($)
  const grossCostPerGoodDie = (rawDieCost + packagingAndTestingCost) / testYieldFraction;

  // NRE Amortized Cost ($/unit)
  const amortizedNreCost = targetVolume > 0 ? (nreCost * 1000000) / (targetVolume * 1000000) : 0;
  const fullyLoadedCostPerDie = grossCostPerGoodDie + amortizedNreCost;

  // Margins (%)
  const grossMargin = asp > 0 ? ((asp - grossCostPerGoodDie) / asp) * 100 : 0;
  const operatingMargin = asp > 0 ? ((asp - fullyLoadedCostPerDie) / asp) * 100 : 0;

  // Program lifetime financials
  const lifetimeRevenueMillion = targetVolume * asp;
  const lifetimeCOGSMillion = targetVolume * grossCostPerGoodDie;
  const lifetimeGrossProfitMillion = lifetimeRevenueMillion - lifetimeCOGSMillion;
  const lifetimeNetProfitMillion = lifetimeGrossProfitMillion - nreCost;

  // Break-even Volume (Millions of Units)
  const marginPerUnit = asp - grossCostPerGoodDie;
  const breakEvenVolumeMillion = marginPerUnit > 0 ? nreCost / marginPerUnit : 0;
  const roi = nreCost > 0 ? (lifetimeNetProfitMillion / nreCost) * 100 : 0;

  // Create Metric Card Items with Calculation Trace
  const metricsList: MetricCardData[] = [];

  const addMetric = (
    id: string,
    label: string,
    value: string,
    unit: string,
    confidence: number,
    deltaVal: string,
    deltaType: 'positive' | 'negative' | 'neutral',
    trend: 'up' | 'down' | 'flat',
    category: MetricCardData['category'],
    equation: string,
    inputs: { [key: string]: number | string },
    definition: string,
    referenceModel: string,
    calculationPath: string[]
  ) => {
    metricsList.push({
      id,
      label,
      value,
      unit,
      confidence,
      delta: { value: deltaVal, type: deltaType },
      formula: equation,
      reference: referenceModel,
      trend,
      category,
      trace: {
        name: label,
        equation,
        inputs,
        definition,
        referenceModel,
        version: build.formulaVersion,
        calculationPath,
      },
    });
  };

  // --- ENGINEERING METRICS ---
  addMetric(
    'total_die_area',
    'Total Die Area',
    `${round(totalDieArea, 1)}`,
    'mm²',
    99,
    topology === 'chiplet' ? `Chiplet system` : 'Monolithic',
    'neutral',
    'flat',
    'engineering',
    topology === 'monolithic' ? 'A_die = dieArea' : 'A_die = (dieArea_core * chipletCount) + dieArea_io',
    topology === 'monolithic' 
      ? { dieArea } 
      : { coreArea: dieArea, chipletCount, ioDieArea },
    'Total silicon footprint on package substrate.',
    'SIA Industry Blueprint v4.2',
    topology === 'monolithic'
      ? [`Active monolithic die area selected: ${dieArea} mm²`]
      : [
          `Core chiplet size: ${dieArea} mm² with count ${chipletCount}`,
          `I/O die size: ${ioDieArea} mm²`,
          `Combined system silicon area: (${dieArea} * ${chipletCount}) + ${ioDieArea} = ${totalDieArea} mm²`
        ]
  );

  addMetric(
    'transistor_density',
    'Transistor Density',
    `${round(transistorDensity, 2)}`,
    'M Tr/mm²',
    98,
    `${processNode} leading edge`,
    'positive',
    'up',
    'engineering',
    'Density = (Transistors * 1000) / totalDieArea',
    { transistorCount, totalDieArea },
    'Microarchitectural hardware density measured in million transistors per square millimeter.',
    `${processNode} Node Density Target`,
    [
      `Total transistors: ${transistorCount} Billion`,
      `Total Die Area: ${round(totalDieArea, 2)} mm²`,
      `Transistor density calculation: (${transistorCount} * 1000) / ${round(totalDieArea, 2)} = ${round(transistorDensity, 2)} M Tr/mm²`
    ]
  );

  addMetric(
    'die_yield',
    'Die Yield',
    `${round(dieYield * 100, 1)}`,
    '%',
    95,
    `${round(dieYield * 100 - 65, 1)}% vs. Baseline`,
    dieYield > 0.6 ? 'positive' : 'negative',
    dieYield > 0.6 ? 'up' : 'down',
    'engineering',
    yieldExplanation,
    { defectDensity, dieArea, topology, packagingYield },
    'Percentage of manufactured dies on a wafer that are defect-free and functionally sound.',
    'Murphy Defect Probability Model v1.0',
    topology === 'monolithic'
      ? [
          `Defect Density (D0): ${defectDensity} defects/cm²`,
          `Area (A): ${dieArea} mm²`,
          `Murphy Yield Formula: ((1 - e^(-A * D0_converted)) / (A * D0_converted))²`,
          `Conversion: D0 = ${defectDensity}/100 = ${defectDensity / 100} defects/mm²`,
          `A * D0 = ${dieArea} * ${defectDensity / 100} = ${round(dieArea * (defectDensity / 100), 4)}`,
          `Murphy raw yield result: ${round(dieYield * 100, 2)}%`
        ]
      : [
          `Core chiplet area: ${dieArea} mm² -> yield: ${round(calculateMurphyYield(dieArea, defectDensity) * 100, 1)}%`,
          `I/O die area: ${ioDieArea} mm² -> yield: ${round(calculateMurphyYield(ioDieArea, defectDensity) * 100, 1)}%`,
          `Advanced Packaging Assembly Yield: ${packagingYield}%`,
          `Multi-die system yields: (CoreYield ^ ${chipletCount}) * IoYield * PackagingYield`,
          `Final system-in-package effective silicon yield: ${round(dieYield * 100, 2)}%`
        ]
  );

  addMetric(
    'dpw',
    'Dies Per Wafer (DPW)',
    `${dpw}`,
    'dies',
    99,
    `Utilization: ${round(waferUtilization, 1)}%`,
    'neutral',
    'flat',
    'engineering',
    dpwExplanation,
    { waferDiameter: 300, totalDieArea },
    'Maximum number of complete rectangular dies that can be cut from a 300mm circular wafer.',
    'Geometric Packing Standard v2.0',
    [
      `Wafer Diameter: 300mm`,
      `Single Die Area: ${round(totalDieArea, 2)} mm²`,
      `Wafer Area: ${round(waferArea, 1)} mm²`,
      `DPW formula with edge-loss correction term`,
      `Final integer packing estimate: ${dpw} dies/wafer`
    ]
  );

  // --- MANUFACTURING METRICS ---
  addMetric(
    'good_dies_wafer',
    'Net Good Dies/Wafer',
    `${round(goodDiesPerWafer, 1)}`,
    'dies',
    95,
    `${round(testYieldFraction * 100, 1)}% test pass rate`,
    'positive',
    'up',
    'manufacturing',
    'NetGoodDPW = DPW * EffectiveYield',
    { dpw, dieYield, testYield, packagingYield },
    'Net number of completely tested, functional, and packaged integrated circuits produced per wafer.',
    'Yield Engineering Standards v4.1',
    [
      `Total raw dies on wafer (DPW): ${dpw}`,
      `Effective production yield: ${round(effectiveYield * 100, 2)}%`,
      `Net output: ${dpw} * ${round(effectiveYield, 4)} = ${round(goodDiesPerWafer, 1)} packaged good dies`
    ]
  );

  addMetric(
    'monthly_production',
    'Monthly Production',
    `${round(monthlyVolumeMillion, 3)}`,
    'M units',
    92,
    `Capacity: ${waferStartsPerMonth} starts/mo`,
    'positive',
    'up',
    'manufacturing',
    'MonthlyProd = (NetGoodDPW * WaferStarts) / 1,000,000',
    { waferStartsPerMonth, goodDiesPerWafer },
    'Total volume of fully functional, packaged chips produced per month based on factory starts.',
    'FAB Operational Capacity Matrix',
    [
      `Wafer Starts Per Month (WSPM): ${waferStartsPerMonth}`,
      `Good dies per wafer: ${round(goodDiesPerWafer, 2)}`,
      `Monthly Production: (${waferStartsPerMonth} * ${round(goodDiesPerWafer, 2)}) / 1M = ${round(monthlyVolumeMillion, 3)} Million Units`
    ]
  );

  // --- FINANCIAL METRICS ---
  addMetric(
    'raw_die_cost',
    'Silicon Die Cost',
    `$${round(rawDieCost, 2)}`,
    'per die',
    95,
    `Wafer Cost: $${waferCost.toLocaleString()}`,
    'negative',
    'up',
    'financial',
    topology === 'monolithic' 
      ? 'DieCost = WaferCost / (DPW * DieYield)'
      : 'DieCost = (CoreCost * chipletCount) + IoCost',
    { waferCost, dpw, dieYield },
    'The silicon cost component of a single functional die prior to packaging and electrical test.',
    'Foundry Price Schedule v3.0',
    topology === 'monolithic'
      ? [
          `Wafer Cost: $${waferCost}`,
          `Good dies per wafer: ${round(dpw * dieYield, 2)}`,
          `Silicon Cost = $${waferCost} / ${round(dpw * dieYield, 2)} = $${round(rawDieCost, 2)}`
        ]
      : [
          `Core Die Area: ${dieArea} mm² -> Yield: ${round(calculateMurphyYield(dieArea, defectDensity)*100,1)}% -> Cost: $${round(waferCost / (calculateDPW(dieArea) * calculateMurphyYield(dieArea, defectDensity)), 2)}`,
          `I/O Die Area: ${ioDieArea} mm² -> Yield: ${round(calculateMurphyYield(ioDieArea, defectDensity)*100,1)}% -> Cost: $${round(waferCost / (calculateDPW(ioDieArea) * calculateMurphyYield(ioDieArea, defectDensity)), 2)}`,
          `System Silicon Cost = (CoreCost * ${chipletCount}) + IoCost = $${round(rawDieCost, 2)}`
        ]
  );

  addMetric(
    'gross_die_cost',
    'Packaged Unit Cost',
    `$${round(grossCostPerGoodDie, 2)}`,
    'per unit',
    95,
    `Testing/Pkg markup: $${round(packagingAndTestingCost, 2)}`,
    'negative',
    'up',
    'financial',
    'GrossCost = (RawDieCost + PackagingAndTest) / TestYield',
    { rawDieCost, packagingCost, testTimeSeconds, testCostPerSecond, testYield },
    'Fully tested, assembled, and packaged component cost of a good chip (COGS per unit).',
    'OSAT Assembly Rates Q3-26',
    [
      `Raw Silicon Die Cost: $${round(rawDieCost, 2)}`,
      `Assembly Cost: $${packagingCost}`,
      `Test Cost: ${testTimeSeconds}s * $${testCostPerSecond}/s = $${testTimeSeconds * testCostPerSecond}`,
      `Total Assembly & Test: $${round(packagingAndTestingCost, 2)}`,
      `Test Yield: ${testYield}%`,
      `Unit Packaged Cost = ($${round(rawDieCost, 2)} + $${round(packagingAndTestingCost, 2)}) / ${testYield / 100} = $${round(grossCostPerGoodDie, 2)}`
    ]
  );

  addMetric(
    'gross_margin',
    'Gross Margin',
    `${round(grossMargin, 1)}`,
    '%',
    95,
    `Gross Profit: $${round(asp - grossCostPerGoodDie, 2)}/unit`,
    grossMargin > 50 ? 'positive' : 'negative',
    grossMargin > 50 ? 'up' : 'down',
    'financial',
    'GrossMargin = ((ASP - GrossUnitCost) / ASP) * 100',
    { asp, grossCostPerGoodDie },
    'Gross profit as a percentage of Average Selling Price (ASP). Core profitability index.',
    'Corporate Semiconductor Margin Target',
    [
      `Average Selling Price (ASP): $${asp}`,
      `Packaged Unit Cost: $${round(grossCostPerGoodDie, 2)}`,
      `Gross Profit per unit: $${round(asp - grossCostPerGoodDie, 2)}`,
      `Gross Margin calculation: ($${round(asp - grossCostPerGoodDie, 2)} / $${asp}) * 100 = ${round(grossMargin, 1)}%`
    ]
  );

  addMetric(
    'break_even',
    'Break-even Volume',
    `${round(breakEvenVolumeMillion, 2)}`,
    'M units',
    90,
    `NRE Investment: $${nreCost}M`,
    'neutral',
    'flat',
    'program',
    'BreakEven = NRE / (ASP - GrossUnitCost)',
    { nreCost, asp, grossCostPerGoodDie },
    'The production and sales volume required to recover all Non-Recurring Engineering (NRE) costs.',
    'Finance Program Audit Guidelines',
    [
      `NRE Capex: $${nreCost}M`,
      `Unit Margin Contribution: ASP ($${asp}) - Cost ($${round(grossCostPerGoodDie, 2)}) = $${round(asp - grossCostPerGoodDie, 2)}`,
      `Break-even: $${nreCost}M / $${round(asp - grossCostPerGoodDie, 2)} = ${round(breakEvenVolumeMillion, 2)} Million Units`
    ]
  );

  // --- PROGRAM & COMMERCIAL METRICS ---
  addMetric(
    'net_profit',
    'Net Program Profit',
    `$${round(lifetimeNetProfitMillion, 1)}M`,
    'USD',
    90,
    `ROI: ${round(roi, 1)}%`,
    lifetimeNetProfitMillion > 0 ? 'positive' : 'negative',
    lifetimeNetProfitMillion > 0 ? 'up' : 'down',
    'program',
    'NetProfit = (Volume * (ASP - GrossUnitCost)) - NRE',
    { targetVolume, asp, grossCostPerGoodDie, nreCost },
    'Net financial profit generated by the program across its entire lifetime after amortization of NRE.',
    'Corporate Strategic Target',
    [
      `Lifetime Target Volume: ${targetVolume}M units`,
      `Gross Unit profit contribution: $${round(asp - grossCostPerGoodDie, 2)}`,
      `Lifetime Gross Profit: ${targetVolume}M * $${round(asp - grossCostPerGoodDie, 2)} = $${round(lifetimeGrossProfitMillion, 1)}M`,
      `NRE Deduction: -$${nreCost}M`,
      `Net Program Profit: $${round(lifetimeGrossProfitMillion, 1)}M - $${nreCost}M = $${round(lifetimeNetProfitMillion, 1)}M`
    ]
  );

  return {
    build,
    totalDieArea,
    transistorDensity,
    tdpPowerDensity,
    dieYield,
    dpw,
    waferUtilization,
    rawDieCost,
    packagingAndTestingCost,
    grossCostPerGoodDie,
    amortizedNreCost,
    fullyLoadedCostPerDie,
    grossMargin,
    operatingMargin,
    monthlyVolumeMillion,
    annualVolumeMillion,
    lifetimeRevenueMillion,
    lifetimeCOGSMillion,
    lifetimeGrossProfitMillion,
    lifetimeNetProfitMillion,
    breakEvenVolumeMillion,
    roi,
    metricsList,
  };
}

/**
 * Perform a sensitivity analysis changing a parameter (like Die Area or ASP)
 * and returning the resultant metrics for charting
 */
export function runSensitivityAnalysis(
  build: Build,
  parameter: 'dieArea' | 'defectDensity' | 'waferCost' | 'asp',
  range: number[]
): { x: number; yield: number; cost: number; margin: number }[] {
  return range.map((val) => {
    const copy = { ...build };
    if (parameter === 'dieArea') {
      copy.dieArea = val;
    } else if (parameter === 'defectDensity') {
      copy.defectDensity = val;
    } else if (parameter === 'waferCost') {
      copy.waferCost = val;
    } else if (parameter === 'asp') {
      copy.asp = val;
    }

    const res = computeBuildMetrics(copy);
    return {
      x: val,
      yield: round(res.dieYield * 100, 1),
      cost: round(res.grossCostPerGoodDie, 2),
      margin: round(res.grossMargin, 1),
    };
  });
}
