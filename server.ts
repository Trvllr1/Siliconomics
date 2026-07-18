/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { handleChippieRequest } from './api/_lib/chippieCore';

dotenv.config();
dotenv.config({ path: '.env.local' }); // NIM_API_KEY / CHIPPIE_* live here in local dev

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

// 1b. API Route: Chippie (NVIDIA NIM-backed advisor) — mirrors api/chippie.ts
app.post('/api/chippie', async (req, res) => {
  const { status, body } = await handleChippieRequest(req.body);
  res.status(status).json(body);
});

// 2. API Route: Gemini Build Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { build, computed } = req.body;
    if (!build || !computed) {
      res.status(400).json({ error: 'Missing build parameters or computed metrics.' });
      return;
    }

    const dm = build.designModel;
    const snap = computed.snapshot;
    const ai = getAiClient();
    
    // If no API Key, send a highly professional localized analytical fallback
    if (!ai) {
      const fallbackAnalysis = `### **Executive Briefing**
The current **${build.name}** build represents a highly strategic implementation on the **${dm.processNode}** process node. Operating at an estimated **${snap.dieYield ? Math.round(snap.dieYield * 100) : 75}%** die yield, the program secures a solid **${snap.grossMargin ? Math.round(snap.grossMargin) : 60}%** gross margin. The program balances advanced electrical performance with solid manufacturing reliability, achieving a break-even threshold of **${snap.breakEvenVolumeMillion ? snap.breakEvenVolumeMillion.toFixed(2) : '2.0'} million units**.

### **Technical Architecture Analysis**
- **Node Choice**: Selecting **${dm.processNode}** offers excellent gate density and power efficiency, but early-stage production introduces minor defect risks.
- **Topology & Reticle Constraints**: The **${dm.topology}** topology of this build represents a calculated choice. ${dm.topology === 'chiplet' ? `By separating compute cores into ${dm.chipletCount} smaller dies (${dm.dieArea} mm² each), you successfully bypass the reticle limit yield penalties associated with larger monolithic designs. This modular layout improves overall silicon yields by approximately 15% but adds packaging complexity.` : `The monolithic layout of ${dm.dieArea} mm² simplifies packaging, avoiding multi-die alignment costs. However, it incurs higher susceptibility to particle defects compared to a modular chiplet topology.`}
- **Power Optimization**: Operating at a Thermal Design Power (TDP) of **${dm.tdp}W** results in a power density of **${snap.tdpPowerDensity ? snap.tdpPowerDensity.toFixed(3) : '0.1'} W/mm²**, requiring standard advanced cooling, but remaining well within thermal design limits.

### **Manufacturing & Risk Report**
- **Defect Density (D0)**: Operating at **${dm.defectDensity} defects/cm²** indicates a mature, highly refined process line. However, any yield drift below 60% would trigger an immediate executive alert as die cost scales exponentially.
- **Advanced Packaging & Test**: Packaging yield is locked at **${dm.packagingYield}%** with test coverage at **${dm.testYield}%**. Testing for **${dm.testTimeSeconds} seconds** per part represents the optimal balance between safety compliance and testing overhead.

### **Financial Sensitivity Summary**
- **Break-Even Analysis**: Amortizing the **$${dm.nreCost}M** NRE requires a volume of **${snap.breakEvenVolumeMillion ? snap.breakEvenVolumeMillion.toFixed(2) : '2.10'} million units** sold at an ASP of **$${dm.asp}**.
- **Margin Sensitivity**: With a unit cost of **$${snap.grossCostPerGoodDie ? snap.grossCostPerGoodDie.toFixed(2) : '85.00'}**, a 10% drop in Average Selling Price (ASP) would compress gross margins by **${snap.grossMargin ? (snap.grossMargin * 0.1).toFixed(1) : '6.5'}%**. We recommend strictly defending the $${dm.asp} ASP through volume bundle guarantees or premium tier feature locks.
`;
      res.json({ analysis: fallbackAnalysis, isDemo: true });
      return;
    }

    const prompt = `You are a World-Class Principal Semiconductor Economist and Chip Architect advising a Fortune 100 Board of Directors on a multi-billion-dollar semiconductor program.
Analyze the following active build data and computed performance/financial metrics.

BUILD PARAMETERS:
- Name: ${build.name} (Version: ${build.version})
- Portfolio: ${build.portfolio}
- Process Node: ${dm.processNode}
- Topology: ${dm.topology} (Count: ${dm.chipletCount} chiplets, I/O Die Area: ${dm.ioDieArea} mm²)
- Die Area: ${dm.dieArea} mm²
- Transistor Count: ${dm.transistorCount} Billion
- TDP: ${dm.tdp} Watts
- Defect Density (D0): ${dm.defectDensity} defects/cm²
- Wafer Starts: ${dm.waferStartsPerMonth} per month
- Packaging Cost: $${dm.packagingCost} (Packaging Yield: ${dm.packagingYield}%)
- Test Time: ${dm.testTimeSeconds}s (Test Yield: ${dm.testYield}%)
- Wafer Cost: $${dm.waferCost}
- NRE Cost: $${dm.nreCost} Million
- Average Selling Price (ASP): $${dm.asp}
- Target Volume: ${dm.targetVolume} Million Units

COMPUTED METRICS:
- Total Area: ${snap.totalDieArea} mm²
- Transistor Density: ${snap.transistorDensity} M Tr/mm²
- Die Yield: ${Math.round(snap.dieYield * 100)}%
- Dies Per Wafer (DPW): ${snap.dpw}
- Good Dies Per Wafer: ${snap.grossCostPerGoodDie ? snap.dpw : 'Calculated'}
- Packaged Unit Cost: $${snap.grossCostPerGoodDie}
- Gross Margin: ${snap.grossMargin}%
- Net Program Profit: $${snap.lifetimeNetProfitMillion} Million
- ROI: ${snap.roi}%
- Break-Even Volume: ${snap.breakEvenVolumeMillion} Million Units

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

    const dmA = buildA.designModel;
    const snapA = computedA.snapshot;
    const dmB = buildB.designModel;
    const snapB = computedB.snapshot;
    const ai = getAiClient();

    if (!ai) {
      const fallbackComparison = `### **Executive Trade-Off Summary**
Comparing **${buildA.name}** and **${buildB.name}** reveals a clear tension between advanced technology node capabilities and manufacturing risk. Build A delivers a gross margin of **${snapA.grossMargin ? Math.round(snapA.grossMargin) : 60}%** and an ROI of **${snapA.roi ? Math.round(snapA.roi) : 80}%**. Build B counter-proposes with a gross margin of **${snapB.grossMargin ? Math.round(snapB.grossMargin) : 70}%** and an ROI of **${snapB.roi ? Math.round(snapB.roi) : 100}%**. Funding Build B unlocks a net profit differential of **$${Math.abs((snapB.lifetimeNetProfitMillion || 0) - (snapA.lifetimeNetProfitMillion || 0)).toFixed(1)}M**, which represents a major financial upgrade.

### **Architectural Trade-Offs**
- **Die Footprint and Density**: Build A utilizes a **${dmA.processNode}** node covering **${snapA.totalDieArea} mm²** of silicon. Build B moves to a **${dmB.processNode}** node spanning **${snapB.totalDieArea} mm²**. Transistor density increases from **${snapA.transistorDensity ? snapA.transistorDensity.toFixed(1) : '50'}** in A to **${snapB.transistorDensity ? snapB.transistorDensity.toFixed(1) : '80'} M Tr/mm²** in B, enabling a highly superior feature set on B.
- **Topology Evaluation**: Build A's **${dmA.topology}** topology vs. Build B's **${dmB.topology}** topology represents two distinct engineering philosophies. ${dmB.topology === 'chiplet' ? `Build B uses modular chiplets to divide silicon risk. This enables smaller, higher-yielding cores that overcome the 3nm defect headwinds, whereas Build A is bound by monolithic yields.` : `Build A uses modular chiplets to divide silicon risk, whereas Build B adopts a monolithic layout. This avoids packaging integration complexity but exposes Build B to severe yield degradation if defect density ticks upwards.`}

### **Operational Risks**
- **Wafer Economics & Test Cost**: Build B involves a wafer cost of **$${dmB.waferCost}** vs. **$${dmA.waferCost}** for Build A. This premium requires a highly resilient packaging and test yield strategy. Build B's test duration of **${dmB.testTimeSeconds} seconds** represents a critical manufacturing bottleneck compared to Build A's **${dmA.testTimeSeconds} seconds**.
- **Defect Susceptibility (D0)**: Operating on **${dmB.processNode}** with **${dmB.defectDensity} defects/cm²** places Build B in a higher-risk operational quadrant than Build A's **${dmA.defectDensity} defects/cm²**.

### **Strategic Recommendation**
We recommend **funding Build B (${buildB.name})** as the primary program. While Build B carries a **$${Math.abs(dmB.nreCost - dmA.nreCost)}M** NRE premium and higher wafer starts complexity, its superior margins, chiplet architecture resiliency, and **$${snapB.lifetimeNetProfitMillion ? snapB.lifetimeNetProfitMillion.toFixed(1) : '400'}M** net program profits offer the most compelling risk-adjusted outcome for the portfolio. Build A should be preserved as a secondary backup option in case of severe 3nm advanced packaging yield delays.
`;
      res.json({ comparison: fallbackComparison, isDemo: true });
      return;
    }

    const prompt = `You are a World-Class Principal Semiconductor Economist and Chip Architect advising a Fortune 100 Board of Directors on a multi-billion-dollar semiconductor portfolio decision.
You must compare two competing semiconductor builds side-by-side: Build A and Build B.

BUILD A DATA:
- Name: ${buildA.name}
- Process Node: ${dmA.processNode} | Topology: ${dmA.topology}
- Die Area: ${dmA.dieArea} mm² | Transistor Count: ${dmA.transistorCount}B
- D0: ${dmA.defectDensity} defects/cm²
- Computed Yield: ${Math.round(snapA.dieYield * 100)}% | DPW: ${snapA.dpw}
- Packaged Unit Cost: $${snapA.grossCostPerGoodDie} | Gross Margin: ${snapA.grossMargin}%
- NRE: $${dmA.nreCost}M | Lifetime Net Profit: $${snapA.lifetimeNetProfitMillion}M | ROI: ${snapA.roi}%

BUILD B DATA:
- Name: ${buildB.name}
- Process Node: ${dmB.processNode} | Topology: ${dmB.topology}
- Die Area: ${dmB.dieArea} mm² | Transistor Count: ${dmB.transistorCount}B
- D0: ${dmB.defectDensity} defects/cm²
- Computed Yield: ${Math.round(snapB.dieYield * 100)}% | DPW: ${snapB.dpw}
- Packaged Unit Cost: $${snapB.grossCostPerGoodDie} | Gross Margin: ${snapB.grossMargin}%
- NRE: $${dmB.nreCost}M | Lifetime Net Profit: $${snapB.lifetimeNetProfitMillion}M | ROI: ${snapB.roi}%

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
