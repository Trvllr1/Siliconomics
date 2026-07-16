/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Build, DesignModel, MetricCardData, CalculationTrace, Snapshot, CostContributor, SupplyChainSnapshot, SupplyChainRiskLevel, CommodityPrice, ArchitectureBlock } from '../types';

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
  snapshot: Snapshot;
}

export function computeBuildMetrics(build: Build): ComputedBuildMetrics {
  const dm = build.designModel;
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
    mpw,
  } = dm;

  const mpwEnabled = mpw?.enabled ?? false;

  // CoWoS / Advanced Packaging configuration
  const packagingType = dm.packagingType ?? 'standard';
  const isAdvancedPackaging = packagingType !== 'standard';
  let interposerArea = dm.interposerArea ?? dieArea * 1.2;

  const cowosConfig = isAdvancedPackaging
    ? ({
        'cowos-s': { costPerMm2: 3.50, yield: 0.96, label: 'CoWoS-S Silicon Interposer' },
        'cowos-r': { costPerMm2: 1.20, yield: 0.98, label: 'CoWoS-R RDL Interposer' },
        'cowos-l': { costPerMm2: 2.20, yield: 0.97, label: 'CoWoS-L Local SI + RDL' },
        'emib': { costPerMm2: 0, yield: 0.99, label: 'Intel EMIB' },
      } as const)[packagingType]
    : null;

  let interposerCostPerUnit = 0;
  const interposerYieldFraction = cowosConfig ? cowosConfig.yield : 1;
  const pkgAssemblyYieldFraction = packagingYield / 100;
  if (cowosConfig) {
    interposerCostPerUnit = packagingType === 'emib'
      ? 12.00 * 2
      : (interposerArea * cowosConfig.costPerMm2) / cowosConfig.yield;
  }

  // MPW-adjusted values override standard NRE/volume when shuttle pricing is active
  const mpwNreCost = mpwEnabled && mpw ? (mpw.shuttleCostPerSlot * mpw.shuttlesPerYear) / 1_000_000 : nreCost;
  const mpwTargetVolume = mpwEnabled && mpw ? (mpw.diesPerSlot * mpw.shuttlesPerYear) / 1_000_000 : targetVolume;
  const effectiveNreCost = mpwEnabled ? mpwNreCost : nreCost;
  const effectiveTargetVolume = mpwEnabled ? mpwTargetVolume : targetVolume;
  const mpwWarning = mpwEnabled && mpw && dieArea > mpw.reticleSlotArea ? '⚠ Die exceeds reticle slot area' : '';

  // Architecture BOM — block-level cost waterfall
  const arch = build.architecture;
  const archBlocks = arch?.blocks ?? [];
  const totalIpNreM = archBlocks.reduce((s, b) => s + (b.nreImpactM ?? 0), 0);
  const totalLicenseFeesM = archBlocks.reduce((s, b) => s + (b.licensingCostM ?? 0), 0);
  const totalRoyaltyBurdenPerUnit = archBlocks.reduce((s, b) => s + (b.royaltyPerUnit ?? 0), 0);
  const effectiveNreCostIp = effectiveNreCost + totalLicenseFeesM + totalIpNreM;

  // Block-weighted effective defect density (from category → defect mapping)
  const catDefect: Record<string, number> = {
    cpu: 1.0, memory: 1.5, security: 1.0, interconnect: 1.0,
    accelerator: 1.0, io: 1.0, power: 0.8, packaging: 0,
    networking: 1.0, rf: 0.7, clocking: 0.9, other: 1.0,
  };
  let blockBreakdownAreaWarning = '';
  if (archBlocks.length > 0) {
    const totalBlockArea = archBlocks.reduce((s, b) => s + b.estimatedAreaMm2, 0);
    if (totalBlockArea > 0) {
      const weightedD0 = archBlocks.reduce((s, b) => s + b.estimatedAreaMm2 * (catDefect[b.category] ?? 1.0), 0) / totalBlockArea;
      const areaDiff = Math.abs(totalBlockArea - dieArea);
      if (areaDiff > dieArea * 0.05) {
        blockBreakdownAreaWarning = `Block area sum (${round(totalBlockArea, 1)} mm²) differs from die area (${dieArea} mm²) by ${round(areaDiff, 1)} mm². Yield estimate uses weighted defect density.`;
      }
    }
  }

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
    
    // Overall effective silicon-assembly yield
    dieYield = siliconYield * interposerYieldFraction * pkgAssemblyYieldFraction;
    totalDieArea = (coreArea * chipletCount) + ioDieArea;
    
    // Equivalent DPW is based on core and I/O die constraints.
    // For every complete system, we need 'chipletCount' cores and 1 I/O.
    // So equivalent DPW per wafer is complex. Let's simplify equivalent DPW:
    // How many systems can we build per wafer equivalent?
    // Cost of silicon set = (chipletCount * CoreCost) + IoCost
    // Or we can define equivalent DPW as WaferArea / totalDieArea * utilization
    dpw = Math.floor(calculateDPW(totalDieArea) * 1.15); // Chiplet layout packing is 15% better due to smaller die modularity!
    
    yieldExplanation = cowosConfig
      ? `Chiplet System: (CoreYield^${chipletCount} * IoYield) * InterposerYield (${(cowosConfig.yield * 100).toFixed(1)}%) * PkgYield (${packagingYield}%)`
      : `Chiplet System: (CoreYield^${chipletCount} * IoYield) * AdvancedPkgYield (${packagingYield}%)`;
    dpwExplanation = `Equivalent DPW representing chiplet packaging efficiency. Cores DPW: ${coreDPW}, I/O DPW: ${ioDPW}`;
  }

  // Update interposerArea default based on computed totalDieArea if user didn't set one explicitly
  if (dm.interposerArea === undefined) {
    interposerArea = totalDieArea * 1.2;
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

  const packagingAndTestingCost = packagingCost + interposerCostPerUnit + (testTimeSeconds * testCostPerSecond);
  
  // Gross Cost per Good Die ($)
  const grossCostPerGoodDie = (rawDieCost + packagingAndTestingCost) / testYieldFraction;

  // Engineering labor cost — computed from selected labor region rate × effort
  const laborRate = dm.resolvedLaborRateDesign ?? 185;
  const laborEffortMonths = dm.designEffortPersonMonths ?? 0;
  const engineeringLaborCostM = (laborRate * 160 * laborEffortMonths) / 1_000_000;

  // IP-extended NRE includes mask NRE + IP license fees + internal IP NRE + engineering labor
  const totalExtendedNre = effectiveNreCostIp + engineeringLaborCostM;
  const totalRoyaltyBurden = totalRoyaltyBurdenPerUnit;

  // NRE Amortized Cost ($/unit)
  const amortizedNreCost = effectiveTargetVolume > 0 ? (effectiveNreCost * 1000000) / (effectiveTargetVolume * 1000000) : 0;
  const amortizedTotalNreCost = effectiveTargetVolume > 0 ? (totalExtendedNre * 1000000) / (effectiveTargetVolume * 1000000) : 0;
  const fullyLoadedCostPerDie = grossCostPerGoodDie + amortizedTotalNreCost + totalRoyaltyBurden;

  // Margins (%)
  const grossMargin = asp > 0 ? ((asp - grossCostPerGoodDie) / asp) * 100 : 0;
  const operatingMargin = asp > 0 ? ((asp - fullyLoadedCostPerDie) / asp) * 100 : 0;

  // Program lifetime financials
  const lifetimeRevenueMillion = effectiveTargetVolume * asp;
  const lifetimeCOGSMillion = effectiveTargetVolume * (grossCostPerGoodDie + totalRoyaltyBurden);
  const lifetimeGrossProfitMillion = lifetimeRevenueMillion - lifetimeCOGSMillion;
  const lifetimeNetProfitMillion = lifetimeGrossProfitMillion - totalExtendedNre;

  // Break-even Volume (Millions of Units)
  const marginPerUnit = asp - (grossCostPerGoodDie + totalRoyaltyBurden);
  const breakEvenVolumeMillion = marginPerUnit > 0 ? totalExtendedNre / marginPerUnit : 0;
  const roi = totalExtendedNre > 0 ? (lifetimeNetProfitMillion / totalExtendedNre) * 100 : 0;

  // Cost Contributor Waterfall — break fully loaded cost into ranked slices
  const volumeUnits = effectiveTargetVolume > 0 ? effectiveTargetVolume * 1_000_000 : 1;
  const contributors: CostContributor[] = [];

  const addContributor = (name: string, category: CostContributor['category'], costPerUnit: number, description: string) => {
    if (costPerUnit > 0.001) {
      contributors.push({ name, category, costPerUnit, percentageOfTotal: 0, description });
    }
  };

  // Gross cost components (pre-NRE, pre-royalty)
  addContributor('Silicon Wafer', 'silicon', rawDieCost / testYieldFraction, 'Raw silicon die cost from foundry wafer pricing.');
  addContributor('Package Substrate & Assembly', 'packaging', packagingCost / testYieldFraction, 'Organic substrate, wirebond/flip-chip assembly, and lid.');
  if (interposerCostPerUnit > 0) {
    const pkgLabel = packagingType === 'emib' ? 'Intel EMIB Bridge' : `${cowosConfig?.label ?? 'Interposer'}`;
    addContributor(pkgLabel, 'packaging', interposerCostPerUnit / testYieldFraction, 'Advanced packaging interposer or embedded bridge cost.');
  }
  addContributor('Electrical Test', 'test', (testTimeSeconds * testCostPerSecond) / testYieldFraction, 'ATE test insertion cost per good unit after yield.');

  // Amortized NRE components
  if (engineeringLaborCostM > 0) {
    addContributor('Engineering Labor (amortized)', 'labor', (engineeringLaborCostM * 1_000_000) / volumeUnits, 'Design engineering effort amortized across lifetime volume.');
  }
  addContributor('Mask NRE (amortized)', 'mask', (effectiveNreCost * 1_000_000) / volumeUnits, 'Mask set and wafer process NRE amortized across lifetime volume.');
  if (totalLicenseFeesM > 0) {
    addContributor('IP License Fees (amortized)', 'ip-license', (totalLicenseFeesM * 1_000_000) / volumeUnits, 'Third-party IP block license fees amortized across lifetime volume.');
  }
  if (totalIpNreM > 0) {
    addContributor('Internal IP NRE (amortized)', 'ip-license', (totalIpNreM * 1_000_000) / volumeUnits, 'Internal architecture block NRE investment amortized across lifetime volume.');
  }
  if (totalRoyaltyBurdenPerUnit > 0) {
    addContributor('IP Royalties', 'ip-royalty', totalRoyaltyBurdenPerUnit, 'Per-unit royalty charges from licensed architecture blocks.');
  }

  // Sort descending by cost, compute percentages
  const totalCost = contributors.reduce((s, c) => s + c.costPerUnit, 0);
  const costContributors = contributors
    .sort((a, b) => b.costPerUnit - a.costPerUnit)
    .map(c => ({ ...c, percentageOfTotal: totalCost > 0 ? (c.costPerUnit / totalCost) * 100 : 0 }));

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

  if (engineeringLaborCostM > 0) {
    addMetric(
      'engineering_labor_cost',
      'Engineering Labor Cost',
      `$${round(engineeringLaborCostM, 1)}M`,
      'USD',
      85,
      `Rate: $${laborRate}/hr × ${laborEffortMonths} person-months`,
      'neutral',
      'up',
      'financial',
      'LaborNRE = hourlyRateDesign × 160 hrs/month × effortMonths',
      { hourlyRateDesign: laborRate, effortMonths: laborEffortMonths },
      'Engineering labor component of total NRE. Computed from selected labor region rate and design effort.',
      laborEffortMonths > 0 ? `${dm.laborReferenceModelId ?? 'ref-labor-northamerica'} Labor Rates v1.0` : 'Global Labor Rate Index',
      [
        `Selected labor rate: $${laborRate}/hr (Design)`,
        `Design effort: ${laborEffortMonths} person-months`,
        `Total labor NRE: $${laborRate} × 160 × ${laborEffortMonths} = $${round(engineeringLaborCostM, 1)}M`
      ]
    );
  }

  addMetric(
    'break_even',
    'Break-even Volume',
    `${round(breakEvenVolumeMillion, 2)}`,
    'M units',
    90,
    `Total NRE: $${round(totalExtendedNre, 1)}M`,
    'neutral',
    'flat',
    'program',
    'BreakEven = TotalNRE / (ASP - GrossUnitCost)',
    { totalExtendedNre, asp, grossCostPerGoodDie },
    'The production and sales volume required to recover all Non-Recurring Engineering (NRE) costs including labor, masks, and IP.',
    'Finance Program Audit Guidelines',
    [
      `Total NRE (Mask + IP + Labor): $${round(totalExtendedNre, 1)}M`,
      `Unit Margin Contribution: ASP ($${asp}) - Cost ($${round(grossCostPerGoodDie, 2)}) = $${round(asp - grossCostPerGoodDie, 2)}`,
      `Break-even: $${round(totalExtendedNre, 1)}M / $${round(asp - grossCostPerGoodDie, 2)} = ${round(breakEvenVolumeMillion, 2)} Million Units`
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
    'NetProfit = (Volume * (ASP - GrossUnitCost - Royalty)) - (MaskNRE + IP_NRE + LicenseFees)',
    { effectiveTargetVolume, asp, grossCostPerGoodDie, totalRoyaltyBurden, totalExtendedNre },
    'Net financial profit generated by the program across its entire lifetime after amortization of NRE and IP costs.',
    'Corporate Strategic Target',
    [
      `Lifetime Target Volume: ${round(effectiveTargetVolume, 3)}M units`,
      `ASP: $${asp} | Unit COGS: $${round(grossCostPerGoodDie, 2)} | Royalty: $${round(totalRoyaltyBurden, 2)}`,
      `Unit Contribution: $${round(asp - grossCostPerGoodDie - totalRoyaltyBurden, 2)}`,
      `Lifetime Gross Profit: ${round(effectiveTargetVolume, 3)}M * $${round(asp - grossCostPerGoodDie - totalRoyaltyBurden, 2)} = $${round(lifetimeGrossProfitMillion, 1)}M`,
      `Total NRE (Mask+IP): $${round(totalExtendedNre, 1)}M`,
      `Net Program Profit: $${round(lifetimeGrossProfitMillion, 1)}M - $${round(totalExtendedNre, 1)}M = $${round(lifetimeNetProfitMillion, 1)}M`
    ]
  );

  // --- MPW-SPECIFIC METRICS (when mpw.enabled) ---
  if (mpwEnabled && mpw) {
    const mpwGoodDiesPerRun = mpw.diesPerSlot * effectiveYield;
    const mpwEffectiveNrePerUnit = mpwGoodDiesPerRun > 0 ? (mpw.shuttleCostPerSlot * mpw.shuttlesPerYear) / (mpwGoodDiesPerRun * mpw.shuttlesPerYear) : 0;
    const mpwShuttleUtil = (mpw.diesPerSlot > 0 ? mpwGoodDiesPerRun / mpw.diesPerSlot : 0) * 100;
    const mpwAnnualVol = (mpwGoodDiesPerRun * mpw.shuttlesPerYear) / 1_000_000;
    const mpwCostVsDedicated = nreCost > 0 ? (1 - effectiveNreCost / nreCost) * 100 : 0;

    addMetric(
      'mpw_effective_nre',
      'MPW NRE per Good Unit',
      `$${round(mpwEffectiveNrePerUnit, 2)}`,
      'per unit',
      90,
      `Shuttle cost: $${mpw.shuttleCostPerSlot.toLocaleString()}/slot`,
      'positive',
      'flat',
      'financial',
      'MPW_NRE_per_unit = (ShuttleCost * ShuttlesPerYear) / (GoodDiesPerRun * ShuttlesPerYear)',
      { shuttleCostPerSlot: mpw.shuttleCostPerSlot, shuttlesPerYear: mpw.shuttlesPerYear, diesPerSlot: mpw.diesPerSlot, effectiveYield },
      'Effective NRE cost contribution per good unit under MPW shuttle pricing.',
      'MPW Shuttle Pricing Model v1.0',
      [
        `Shuttle cost per slot: $${mpw.shuttleCostPerSlot.toLocaleString()}`,
        `Shuttle runs per year: ${mpw.shuttlesPerYear}`,
        `Gross dies per slot: ${mpw.diesPerSlot}`,
        `Effective yield: ${round(effectiveYield * 100, 1)}%`,
        `Good dies per run: ${round(mpwGoodDiesPerRun, 1)}`,
        `NRE per good unit = ($${mpw.shuttleCostPerSlot.toLocaleString()} * ${mpw.shuttlesPerYear}) / (${round(mpwGoodDiesPerRun, 1)} * ${mpw.shuttlesPerYear}) = $${round(mpwEffectiveNrePerUnit, 2)}`
      ]
    );

    addMetric(
      'mpw_shuttle_utilization',
      'MPW Slot Utilization',
      `${round(mpwShuttleUtil, 1)}`,
      '%',
      90,
      `${round(mpwGoodDiesPerRun, 1)} good / ${mpw.diesPerSlot} allocated`,
      mpwShuttleUtil > 80 ? 'positive' : 'negative',
      mpwShuttleUtil > 80 ? 'up' : 'down',
      'manufacturing',
      'Utilization = (GoodDiesPerRun / DiesPerSlot) * 100',
      { diesPerSlot: mpw.diesPerSlot, goodDiesPerRun: mpwGoodDiesPerRun },
      'Percentage of allocated reticle slot dies that pass electrical test.',
      'MPW Yield Tracking Standard v1.0',
      [
        `Gross dies allocated per run: ${mpw.diesPerSlot}`,
        `Good dies after yield: ${round(mpwGoodDiesPerRun, 1)}`,
        `Slot utilization: ${round(mpwGoodDiesPerRun, 1)} / ${mpw.diesPerSlot} = ${round(mpwShuttleUtil, 1)}%`
      ]
    );

    addMetric(
      'mpw_annual_volume',
      'MPW Annual Volume',
      `${round(mpwAnnualVol, 3)}`,
      'M units',
      85,
      `${mpw.shuttlesPerYear} shuttles/yr`,
      'neutral',
      'flat',
      'program',
      'AnnualVol = (GoodDiesPerRun * ShuttlesPerYear) / 1,000,000',
      { goodDiesPerRun: mpwGoodDiesPerRun, shuttlesPerYear: mpw.shuttlesPerYear },
      'Maximum annual production volume constrained by shuttle run schedule and die allocation.',
      'MPW Shuttle Calendar v1.0',
      [
        `Good dies per run: ${round(mpwGoodDiesPerRun, 1)}`,
        `Shuttle runs per year: ${mpw.shuttlesPerYear}`,
        `Annual volume: (${round(mpwGoodDiesPerRun, 1)} * ${mpw.shuttlesPerYear}) / 1M = ${round(mpwAnnualVol, 3)}M units`
      ]
    );

    addMetric(
      'mpw_cost_vs_dedicated',
      'NRE Savings vs. Dedicated',
      `${round(mpwCostVsDedicated, 1)}`,
      '%',
      85,
      `Dedicated NRE: $${nreCost}M`,
      mpwCostVsDedicated > 50 ? 'positive' : 'neutral',
      'up',
      'financial',
      'Saving = (1 - MPW_NRE / Dedicated_NRE) * 100',
      { mpwNreCost: effectiveNreCost, dedicatedNreCost: nreCost },
      'Percentage NRE cost savings by using MPW shuttle instead of a dedicated mask set.',
      'MPW vs. Dedicated Cost Comparison v1.0',
      [
        `Dedicated mask set NRE: $${nreCost}M`,
        `MPW effective NRE: $${round(effectiveNreCost, 2)}M`,
        `NRE savings: (1 - $${round(effectiveNreCost, 2)}M / $${nreCost}M) * 100 = ${round(mpwCostVsDedicated, 1)}%`
      ]
    );
  }

  // --- ARCHITECTURE BOM — IP PORTFOLIO METRICS ---
  if (archBlocks.length > 0) {
    const ipNreTotal = totalLicenseFeesM + totalIpNreM;
    const ipCostPerUnit = effectiveTargetVolume > 0 ? (ipNreTotal * 1000000) / (effectiveTargetVolume * 1000000) : 0;
    const ipCostPctCogs = fullyLoadedCostPerDie > 0 ? ((amortizedTotalNreCost + totalRoyaltyBurden) / fullyLoadedCostPerDie) * 100 : 0;
    const externalCount = archBlocks.filter(b => b.implementation === 'licensed').length;

    addMetric(
      'ip_nre_waterfall',
      'IP NRE Waterfall',
      `$${round(ipNreTotal, 1)}M`,
      'USD',
      90,
      `License: $${round(totalLicenseFeesM, 1)}M | Internal: $${round(totalIpNreM, 1)}M`,
      'neutral',
      'up',
      'financial',
      'IP_NRE_total = Σ(LicenseFees) + Σ(Internal_NRE)',
      { totalLicenseFeesM, totalIpNreM },
      'Total non-recurring investment in architecture blocks including license fees and internal design costs.',
      'Architecture BOM Cost Model v1.0',
      [
        `Licensed blocks: ${externalCount} with $${round(totalLicenseFeesM, 1)}M total license fees`,
        `Internal blocks: ${archBlocks.length - externalCount} with $${round(totalIpNreM, 1)}M total internal NRE`,
        `Combined IP NRE: $${round(ipNreTotal, 1)}M`
      ]
    );

    if (totalRoyaltyBurden > 0) {
      addMetric(
        'ip_royalty_burden',
        'IP Royalty Burden',
        `$${round(totalRoyaltyBurden, 2)}`,
        'per unit',
        88,
        `Added to COGS chip cost`,
        totalRoyaltyBurden < 1 ? 'neutral' : 'negative',
        'up',
        'financial',
        'Royalty_total = Σ(Blocks.royaltyPerUnit)',
        { totalRoyaltyBurden },
        'Total per-unit royalty cost from architecture blocks with royalty-based pricing.',
        'Architecture BOM Royalty Schedule v1.0',
        [
          `${archBlocks.filter(b => (b.royaltyPerUnit ?? 0) > 0).length} block(s) charge royalties`,
          `Total royalty burden: $${round(totalRoyaltyBurden, 2)} per unit`
        ]
      );
    }

    addMetric(
      'ip_cost_pct_cogs',
      'IP Cost % of COGS',
      `${round(ipCostPctCogs, 1)}`,
      '%',
      85,
      `Am. NRE: $${round(amortizedTotalNreCost, 2)} + Royalty: $${round(totalRoyaltyBurden, 2)}`,
      ipCostPctCogs > 30 ? 'negative' : 'neutral',
      'up',
      'commercial',
      'IP_Cost_% = (AmortizedIP_NRE + Royalty) / FullyLoadedCost * 100',
      { amortizedTotalNreCost, totalRoyaltyBurden, fullyLoadedCostPerDie },
      'Percentage of fully loaded unit cost attributable to IP licensing, royalties, and internal IP development amortization.',
      'IP Cost Attribution Model v1.0',
      [
        `Amortized NRE (Mask + IP): $${round(amortizedTotalNreCost, 2)}/unit`,
        `Royalty burden: $${round(totalRoyaltyBurden, 2)}/unit`,
        `Fully loaded cost: $${round(fullyLoadedCostPerDie, 2)}/unit`,
        `IP cost contribution: ${round(ipCostPctCogs, 1)}%`
      ]
    );
  }

  // --- CoWoS / ADVANCED PACKAGING METRICS ---
  if (isAdvancedPackaging && cowosConfig) {
    const cowosThermalDensity = interposerArea > 0 ? tdp / interposerArea : 0;
    const cowosSavingsVsStandard = packagingCost > 0 ? ((packagingCost - interposerCostPerUnit) / packagingCost) * 100 : 0;

    addMetric(
      'interposer_cost',
      `${cowosConfig.label} Cost`,
      `$${round(interposerCostPerUnit, 2)}`,
      'per unit',
      88,
      `Area: ${round(interposerArea, 1)} mm²`,
      interposerCostPerUnit < 50 ? 'neutral' : 'negative',
      'up',
      'manufacturing',
      packagingType === 'emib'
        ? 'BridgeCost = BridgesPerPkg × CostPerBridge / BridgeYield'
        : 'InterposerCost = (InterposerArea × CostPerMm²) / InterposerYield',
      { interposerArea, costPerMm2: cowosConfig.costPerMm2, interposerYield: cowosConfig.yield },
      'Per-unit cost contribution of the interposer or bridge in the advanced packaging stack.',
      `${cowosConfig.label} Pricing v1.0`,
      packagingType === 'emib'
        ? [`Bridge bridges per package: 2`, `Cost per bridge: $12.00`, `Bridge yield: ${(cowosConfig.yield * 100).toFixed(1)}%`, `Interposer cost: $${round(interposerCostPerUnit, 2)}`]
        : [`Interposer area: ${round(interposerArea, 1)} mm²`, `Cost per mm²: $${cowosConfig.costPerMm2.toFixed(2)}`, `Interposer yield: ${(cowosConfig.yield * 100).toFixed(1)}%`, `Interposer cost: (${round(interposerArea, 1)} × $${cowosConfig.costPerMm2.toFixed(2)}) / ${(cowosConfig.yield * 100).toFixed(1)}% = $${round(interposerCostPerUnit, 2)}`]
    );

    addMetric(
      'cowos_thermal_density',
      'CoWoS Thermal Density',
      `${round(cowosThermalDensity, 3)}`,
      'W/mm²',
      85,
      `TDP: ${tdp}W across ${round(interposerArea, 1)} mm²`,
      cowosThermalDensity > 0.5 ? 'negative' : 'neutral',
      'flat',
      'engineering',
      'ThermalDensity = TDP_total / InterposerArea',
      { tdp, interposerArea },
      'Thermal power density across the interposer surface. Values > 0.5 W/mm² typically require advanced cooling.',
      'TSMC CoWoS Thermal Guidelines v1.0',
      [`Total system TDP: ${tdp}W`, `Interposer area: ${round(interposerArea, 1)} mm²`, `Thermal density: ${tdp}W / ${round(interposerArea, 1)} mm² = ${round(cowosThermalDensity, 3)} W/mm²`]
    );

    if (topology === 'chiplet') {
      const cowosYieldMultiplier = interposerYieldFraction * pkgAssemblyYieldFraction;
      addMetric(
        'cowos_yield_multiplier',
        'CoWoS Yield Multiplier',
        `${round(cowosYieldMultiplier * 100, 1)}`,
        '%',
        92,
        `Interposer × Assembly`,
        cowosYieldMultiplier > 0.95 ? 'positive' : 'neutral',
        'flat',
        'manufacturing',
        'Y_cowos = InterposerYield × AssemblyYield (stacked on chiplet yields)',
        { interposerYield: cowosConfig.yield, assemblyYield: packagingYield },
        'Combined yield multiplier applied by the interposer and assembly process in the CoWoS packaging stack.',
        'TSMC CoWoS Yield Management v1.0',
        [`Interposer/bridge yield: ${(cowosConfig.yield * 100).toFixed(1)}%`, `Package assembly yield: ${packagingYield}%`, `Combined yield multiplier: ${(cowosConfig.yield * 100).toFixed(1)}% × ${packagingYield}% = ${round(cowosYieldMultiplier * 100, 1)}%`]
      );
    }
  }

  const supplyChain = computeSupplyChainMetrics(archBlocks, rawDieCost, packagingCost, isAdvancedPackaging);

  const snapshot: Snapshot = {
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
    totalIpNreM,
    totalLicenseFeesM,
    totalRoyaltyBurdenPerUnit,
    engineeringLaborCostM,
    costContributors,
    supplyChain,
    metricsList,
  };

  return { build, snapshot };
}

function computeSupplyChainMetrics(
  blocks: ArchitectureBlock[],
  waferCost: number,
  packagingCost: number,
  isAdvancedPackaging: boolean
): SupplyChainSnapshot {
  const riskScoreMap: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
  const totalBlocks = blocks.length;

  const blockRiskScores = blocks.map(b => riskScoreMap[b.supplyChainRisk] ?? 0);
  const totalRiskScore = blockRiskScores.reduce((s, v) => s + v, 0);
  const maxPossible = totalBlocks * 3;
  const compositeRiskScore = maxPossible > 0 ? round((totalRiskScore / maxPossible) * 100, 1) : 0;

  const highRiskBlockCount = blocks.filter(b => b.supplyChainRisk === 'high').length;

  const riskLevel: SupplyChainRiskLevel =
    compositeRiskScore >= 70 ? 'critical'
    : compositeRiskScore >= 50 ? 'high'
    : compositeRiskScore >= 30 ? 'elevated'
    : compositeRiskScore >= 15 ? 'moderate'
    : 'low';

  // Commodity costs embedded in the build
  const commodityCostPerUnit = round(
    (waferCost || 0) + (packagingCost || 0) + (isAdvancedPackaging ? 15 : 0),
    2
  );

  // Supplier concentration: estimate from implementation types
  const licensedCount = blocks.filter(b => b.implementation === 'licensed').length;
  const supplierConcentrationScore = totalBlocks > 0
    ? round((licensedCount / totalBlocks) * 50 + (highRiskBlockCount / Math.max(totalBlocks, 1)) * 50, 1)
    : 0;

  // Geopolitical: estimate from high-risk blocks
  const geopoliticalRiskScore = totalBlocks > 0
    ? round((highRiskBlockCount / totalBlocks) * 100, 1)
    : 10;

  const leadTimeVolatilityScore = totalBlocks > 0
    ? round(
        (blocks.filter(b => b.supplyChainRisk === 'high').length / totalBlocks) * 60 +
        (blocks.filter(b => b.supplyChainRisk === 'medium').length / totalBlocks) * 30 +
        (blocks.filter(b => b.supplyChainRisk === 'low').length / totalBlocks) * 10,
        1
      )
    : 5;

  // Risk-adjusted cost adder as % uplift on wafer cost
  const riskAdjustedCostAdder = round(waferCost * (compositeRiskScore / 100) * 0.15, 2);

  const topCommodityCosts = [
    { name: 'Wafer (front-end)', costPerUnit: waferCost, category: 'wafer' as const },
    { name: 'Package & Test', costPerUnit: packagingCost + (isAdvancedPackaging ? 15 : 0), category: 'substrate' as const },
  ];

  return {
    compositeRiskScore,
    riskLevel,
    highRiskBlockCount,
    totalBlockCount: totalBlocks,
    commodityCostPerUnit,
    supplierConcentrationScore,
    geopoliticalRiskScore,
    leadTimeVolatilityScore,
    riskAdjustedCostAdder,
    topCommodityCosts,
  };
}

/**
 * Perform a sensitivity analysis changing a parameter (like Die Area or ASP)
 * and returning the resultant metrics for charting
 */
export function runSensitivityAnalysis(
  build: Build,
  parameter: keyof DesignModel,
  range: number[]
): { x: number; yield: number; cost: number; margin: number }[] {
  return range.map((val) => {
    const copy = { ...build, designModel: { ...build.designModel } };
    (copy.designModel as any)[parameter] = val;

    const res = computeBuildMetrics(copy);
    return {
      x: val,
      yield: round(res.snapshot.dieYield * 100, 1),
      cost: round(res.snapshot.grossCostPerGoodDie, 2),
      margin: round(res.snapshot.grossMargin, 1),
    };
  });
}
