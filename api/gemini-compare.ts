import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { buildA, computedA, buildB, computedB } = req.body;
    if (!buildA || !computedA || !buildB || !computedB) {
      return res.status(400).json({ error: 'Missing parameters for comparison.' });
    }

    const dmA = buildA.designModel;
    const snapA = computedA.snapshot;
    const dmB = buildB.designModel;
    const snapB = computedB.snapshot;
    const ai = getAiClient();

    if (!ai) {
      res.json({
        comparison: `### **Executive Trade-Off Summary**
Comparing **${buildA.name}** and **${buildB.name}** reveals a clear tension between advanced technology node capabilities and manufacturing risk. Build A delivers a gross margin of **${snapA.grossMargin ? Math.round(snapA.grossMargin) : 60}%** and an ROI of **${snapA.roi ? Math.round(snapA.roi) : 80}%**. Build B counter-proposes with a gross margin of **${snapB.grossMargin ? Math.round(snapB.grossMargin) : 70}%** and an ROI of **${snapB.roi ? Math.round(snapB.roi) : 100}%**. Funding Build B unlocks a net profit differential of **$${Math.abs((snapB.lifetimeNetProfitMillion || 0) - (snapA.lifetimeNetProfitMillion || 0)).toFixed(1)}M**.

### **Architectural Trade-Offs**
- **Die Footprint and Density**: Build A uses **${dmA.processNode}** covering **${snapA.totalDieArea} mm²**. Build B moves to **${dmB.processNode}** spanning **${snapB.totalDieArea} mm²**.
- **Topology Evaluation**: Build A's **${dmA.topology}** vs Build B's **${dmB.topology}**.

### **Operational Risks**
- **Wafer Economics**: Build B wafer cost **$${dmB.waferCost}** vs **$${dmA.waferCost}** for Build A.
- **Defect Susceptibility**: Build B at **${dmB.defectDensity} defects/cm²** vs Build A's **${dmA.defectDensity}**.

### **Strategic Recommendation**
We recommend funding Build B (${buildB.name}) as the primary program. While Build B carries a **$${Math.abs(dmB.nreCost - dmA.nreCost)}M** NRE premium, its superior margins and **$${snapB.lifetimeNetProfitMillion ? snapB.lifetimeNetProfitMillion.toFixed(1) : '400'}M** net program profits offer the best risk-adjusted outcome.`,
        isDemo: true,
      });
      return;
    }

    const prompt = `You are a World-Class Principal Semiconductor Economist and Chip Architect advising a Fortune 100 Board of Directors. Compare two builds side-by-side.

BUILD A: ${buildA.name} (${dmA.processNode}, ${dmA.topology})
- Die Area: ${dmA.dieArea} mm² | Transistors: ${dmA.transistorCount}B | D0: ${dmA.defectDensity}
- Yield: ${Math.round(snapA.dieYield * 100)}% | DPW: ${snapA.dpw}
- Unit Cost: $${snapA.grossCostPerGoodDie} | Margin: ${snapA.grossMargin}%
- NRE: $${dmA.nreCost}M | Net Profit: $${snapA.lifetimeNetProfitMillion}M | ROI: ${snapA.roi}%

BUILD B: ${buildB.name} (${dmB.processNode}, ${dmB.topology})
- Die Area: ${dmB.dieArea} mm² | Transistors: ${dmB.transistorCount}B | D0: ${dmB.defectDensity}
- Yield: ${Math.round(snapB.dieYield * 100)}% | DPW: ${snapB.dpw}
- Unit Cost: $${snapB.grossCostPerGoodDie} | Margin: ${snapB.grossMargin}%
- NRE: $${dmB.nreCost}M | Net Profit: $${snapB.lifetimeNetProfitMillion}M | ROI: ${snapB.roi}%

Generate a side-by-side analysis. Use H3 headings:
1. ### **Executive Trade-Off Summary** (3 sentences comparing margins, ROI, profit differentials)
2. ### **Architectural Trade-Offs** (node choices, density, monolithic vs chiplet)
3. ### **Operational Risks** (wafer costs, yields, defect densities)
4. ### **Strategic Recommendation** (which build to fund, backed by risk-adjusted metrics)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { temperature: 0.15 },
    });

    res.json({ comparison: response.text || 'No response generated.', isDemo: false });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Error during AI comparison.' });
  }
}
