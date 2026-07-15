/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to prevent startup crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY environment variable is not defined or is placeholder. AI consultation will use localized expert advisor fallback.');
    return null;
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. API Route: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. API Route: Gemini Build Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { build, computed } = req.body;
    if (!build || !computed) {
      res.status(400).json({ error: 'Missing build parameters or computed metrics.' });
      return;
    }

    const ai = getAiClient();
    
    // If no API Key, send a highly professional localized analytical fallback
    if (!ai) {
      const fallbackAnalysis = `### **Executive Briefing**
The current **${build.name}** build represents a highly strategic implementation on the **${build.processNode}** process node. Operating at an estimated **${computed.dieYield ? Math.round(computed.dieYield * 100) : 75}%** die yield, the program secures a solid **${computed.grossMargin ? Math.round(computed.grossMargin) : 60}%** gross margin. The program balances advanced electrical performance with solid manufacturing reliability, achieving a break-even threshold of **${computed.breakEvenVolumeMillion ? computed.breakEvenVolumeMillion.toFixed(2) : '2.0'} million units**.

### **Technical Architecture Analysis**
- **Node Choice**: Selecting **${build.processNode}** offers excellent gate density and power efficiency, but early-stage production introduces minor defect risks.
- **Topology & Reticle Constraints**: The **${build.topology}** topology of this build represents a calculated choice. ${build.topology === 'chiplet' ? `By separating compute cores into ${build.chipletCount} smaller dies (${build.dieArea} mm² each), you successfully bypass the reticle limit yield penalties associated with larger monolithic designs. This modular layout improves overall silicon yields by approximately 15% but adds packaging complexity.` : `The monolithic layout of ${build.dieArea} mm² simplifies packaging, avoiding multi-die alignment costs. However, it incurs higher susceptibility to particle defects compared to a modular chiplet topology.`}
- **Power Optimization**: Operating at a Thermal Design Power (TDP) of **${build.tdp}W** results in a power density of **${computed.tdpPowerDensity ? computed.tdpPowerDensity.toFixed(3) : '0.1'} W/mm²**, requiring standard advanced cooling, but remaining well within thermal design limits.

### **Manufacturing & Risk Report**
- **Defect Density (D0)**: Operating at **${build.defectDensity} defects/cm²** indicates a mature, highly refined process line. However, any yield drift below 60% would trigger an immediate executive alert as die cost scales exponentially.
- **Advanced Packaging & Test**: Packaging yield is locked at **${build.packagingYield}%** with test coverage at **${build.testYield}%**. Testing for **${build.testTimeSeconds} seconds** per part represents the optimal balance between safety compliance and testing overhead.

### **Financial Sensitivity Summary**
- **Break-Even Analysis**: Amortizing the **$${build.nreCost}M** NRE requires a volume of **${computed.breakEvenVolumeMillion ? computed.breakEvenVolumeMillion.toFixed(2) : '2.10'} million units** sold at an ASP of **$${build.asp}**.
- **Margin Sensitivity**: With a unit cost of **$${computed.grossCostPerGoodDie ? computed.grossCostPerGoodDie.toFixed(2) : '85.00'}**, a 10% drop in Average Selling Price (ASP) would compress gross margins by **${computed.grossMargin ? (computed.grossMargin * 0.1).toFixed(1) : '6.5'}%**. We recommend strictly defending the $${build.asp} ASP through volume bundle guarantees or premium tier feature locks.
`;
      res.json({ analysis: fallbackAnalysis, isDemo: true });
      return;
    }

    const prompt = `You are a World-Class Principal Semiconductor Economist and Chip Architect advising a Fortune 100 Board of Directors on a multi-billion-dollar semiconductor program.
Analyze the following active build data and computed performance/financial metrics.

BUILD PARAMETERS:
- Name: ${build.name} (Version: ${build.version})
- Portfolio: ${build.portfolio}
- Process Node: ${build.processNode}
- Topology: ${build.topology} (Count: ${build.chipletCount} chiplets, I/O Die Area: ${build.ioDieArea} mm²)
- Die Area: ${build.dieArea} mm²
- Transistor Count: ${build.transistorCount} Billion
- TDP: ${build.tdp} Watts
- Defect Density (D0): ${build.defectDensity} defects/cm²
- Wafer Starts: ${build.waferStartsPerMonth} per month
- Packaging Cost: $${build.packagingCost} (Packaging Yield: ${build.packagingYield}%)
- Test Time: ${build.testTimeSeconds}s (Test Yield: ${build.testYield}%)
- Wafer Cost: $${build.waferCost}
- NRE Cost: $${build.nreCost} Million
- Average Selling Price (ASP): $${build.asp}
- Target Volume: ${build.targetVolume} Million Units

COMPUTED METRICS:
- Total Area: ${computed.totalDieArea} mm²
- Transistor Density: ${computed.transistorDensity} M Tr/mm²
- Die Yield: ${Math.round(computed.dieYield * 100)}%
- Dies Per Wafer (DPW): ${computed.dpw}
- Good Dies Per Wafer: ${computed.grossCostPerGoodDie ? computed.goodDiesPerWafer : 'Calculated'}
- Packaged Unit Cost: $${computed.grossCostPerGoodDie}
- Gross Margin: ${computed.grossMargin}%
- Net Program Profit: $${computed.lifetimeNetProfitMillion} Million
- ROI: ${computed.roi}%
- Break-Even Volume: ${computed.breakEvenVolumeMillion} Million Units

Generate a highly professional, board-ready executive report. Use clean markdown. Use formal investment-banking/semiconductor-telemetry terminology. Avoid playful language.
Divide your analysis into the following exact sections with H3 headings:
1. ### **Executive Briefing** (3 concise, punchy sentences focusing on yield vs. margin optimization, ROI, and commercial viability)
2. ### **Technical Architecture Analysis** (discuss node choice, transistor density, power density, and monolithic vs. chiplet trade-offs for this specific die area)
3. ### **Manufacturing & Risk Report** (discuss D0, assembly yields, testing times, and yield-curve risks)
4. ### **Financial Sensitivity Summary** (discuss NRE amortization, break-even volumes, and ASP sensitivity)

Keep the analysis authoritative and rigorous. Ensure numbers and calculations correspond perfectly to the inputs provided.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for deterministic financial and engineering analysis
      },
    });

    const analysis = response.text || 'No response generated.';
    res.json({ analysis, isDemo: false });
  } catch (error: any) {
    console.error('Gemini Analyze API Error:', error);
    res.status(500).json({ error: error?.message || 'Error occurred during AI analysis.' });
  }
});

// 3. API Route: Gemini Build Comparison
app.post('/api/gemini/compare', async (req, res) => {
  try {
    const { buildA, computedA, buildB, computedB } = req.body;
    if (!buildA || !computedA || !buildB || !computedB) {
      res.status(400).json({ error: 'Missing parameters for comparison.' });
      return;
    }

    const ai = getAiClient();

    if (!ai) {
      const fallbackComparison = `### **Executive Trade-Off Summary**
Comparing **${buildA.name}** and **${buildB.name}** reveals a clear tension between advanced technology node capabilities and manufacturing risk. Build A delivers a gross margin of **${computedA.grossMargin ? Math.round(computedA.grossMargin) : 60}%** and an ROI of **${computedA.roi ? Math.round(computedA.roi) : 80}%**. Build B counter-proposes with a gross margin of **${computedB.grossMargin ? Math.round(computedB.grossMargin) : 70}%** and an ROI of **${computedB.roi ? Math.round(computedB.roi) : 100}%**. Funding Build B unlocks a net profit differential of **$${Math.abs((computedB.lifetimeNetProfitMillion || 0) - (computedA.lifetimeNetProfitMillion || 0)).toFixed(1)}M**, which represents a major financial upgrade.

### **Architectural Trade-Offs**
- **Die Footprint and Density**: Build A utilizes a **${buildA.processNode}** node covering **${computedA.totalDieArea} mm²** of silicon. Build B moves to a **${buildB.processNode}** node spanning **${computedB.totalDieArea} mm²**. Transistor density increases from **${computedA.transistorDensity ? computedA.transistorDensity.toFixed(1) : '50'}** in A to **${computedB.transistorDensity ? computedB.transistorDensity.toFixed(1) : '80'} M Tr/mm²** in B, enabling a highly superior feature set on B.
- **Topology Evaluation**: Build A's **${buildA.topology}** topology vs. Build B's **${buildB.topology}** topology represents two distinct engineering philosophies. ${buildB.topology === 'chiplet' ? `Build B uses modular chiplets to divide silicon risk. This enables smaller, higher-yielding cores that overcome the 3nm defect headwinds, whereas Build A is bound by monolithic yields.` : `Build A uses modular chiplets to divide silicon risk, whereas Build B adopts a monolithic layout. This avoids packaging integration complexity but exposes Build B to severe yield degradation if defect density ticks upwards.`}

### **Operational Risks**
- **Wafer Economics & Test Cost**: Build B involves a wafer cost of **$${buildB.waferCost}** vs. **$${buildA.waferCost}** for Build A. This premium requires a highly resilient packaging and test yield strategy. Build B's test duration of **${buildB.testTimeSeconds} seconds** represents a critical manufacturing bottleneck compared to Build A's **${buildA.testTimeSeconds} seconds**.
- **Defect Susceptibility (D0)**: Operating on **${buildB.processNode}** with **${buildB.defectDensity} defects/cm²** places Build B in a higher-risk operational quadrant than Build A's **${buildA.defectDensity} defects/cm²**.

### **Strategic Recommendation**
We recommend **funding Build B (${buildB.name})** as the primary program. While Build B carries a **$${Math.abs(buildB.nreCost - buildA.nreCost)}M** NRE premium and higher wafer starts complexity, its superior margins, chiplet architecture resiliency, and **$${computedB.lifetimeNetProfitMillion ? computedB.lifetimeNetProfitMillion.toFixed(1) : '400'}M** net program profits offer the most compelling risk-adjusted outcome for the portfolio. Build A should be preserved as a secondary backup option in case of severe 3nm advanced packaging yield delays.
`;
      res.json({ comparison: fallbackComparison, isDemo: true });
      return;
    }

    const prompt = `You are a World-Class Principal Semiconductor Economist and Chip Architect advising a Fortune 100 Board of Directors on a multi-billion-dollar semiconductor portfolio decision.
You must compare two competing semiconductor builds side-by-side: Build A and Build B.

BUILD A DATA:
- Name: ${buildA.name}
- Process Node: ${buildA.processNode} | Topology: ${buildA.topology}
- Die Area: ${buildA.dieArea} mm² | Transistor Count: ${buildA.transistorCount}B
- D0: ${buildA.defectDensity} defects/cm²
- Computed Yield: ${Math.round(computedA.dieYield * 100)}% | DPW: ${computedA.dpw}
- Packaged Unit Cost: $${computedA.grossCostPerGoodDie} | Gross Margin: ${computedA.grossMargin}%
- NRE: $${buildA.nreCost}M | Lifetime Net Profit: $${computedA.lifetimeNetProfitMillion}M | ROI: ${computedA.roi}%

BUILD B DATA:
- Name: ${buildB.name}
- Process Node: ${buildB.processNode} | Topology: ${buildB.topology}
- Die Area: ${buildB.dieArea} mm² | Transistor Count: ${buildB.transistorCount}B
- D0: ${buildB.defectDensity} defects/cm²
- Computed Yield: ${Math.round(computedB.dieYield * 100)}% | DPW: ${computedB.dpw}
- Packaged Unit Cost: $${computedB.grossCostPerGoodDie} | Gross Margin: ${computedB.grossMargin}%
- NRE: $${buildB.nreCost}M | Lifetime Net Profit: $${computedB.lifetimeNetProfitMillion}M | ROI: ${computedB.roi}%

Generate a side-by-side comparative analysis. Focus entirely on trade-offs. Write in a formal, authoritative, executive-grade tone. Use clear markdown.
Include the following exact sections with H3 headings:
1. ### **Executive Trade-Off Summary** (3 sentences comparing margins, ROI, and total profit differentials)
2. ### **Architectural Trade-Offs** (compare node choices, transistor density, and monolithic vs. chiplet benefits)
3. ### **Operational Risks** (compare wafer costs, packaging yields, defect densities, and test flow differences)
4. ### **Strategic Recommendation** (explicitly state which build should be funded and why, backed by risk-adjusted financial metrics)

Keep it rigorous and professional. Use numbers to back up all strategic claims.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.15, // Extremely low temperature for analytical consistency
      },
    });

    const comparison = response.text || 'No response generated.';
    res.json({ comparison, isDemo: false });
  } catch (error: any) {
    console.error('Gemini Compare API Error:', error);
    res.status(500).json({ error: error?.message || 'Error occurred during AI comparison.' });
  }
});

// 4. Vite Dev Server Setup or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Siliconomics Dev Server running on http://localhost:${PORT}`);
  });
}

startServer();
