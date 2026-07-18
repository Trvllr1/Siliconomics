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
    const { build, computed } = req.body;
    if (!build || !computed) return res.status(400).json({ error: 'Missing build parameters or computed metrics.' });

    const dm = build.designModel;
    const snap = computed.snapshot;
    const ai = getAiClient();

    if (!ai) {
      res.json({
        analysis: `### **Executive Briefing**
The current **${build.name}** build represents a highly strategic implementation on the **${dm.processNode}** process node. Operating at an estimated **${snap.dieYield ? Math.round(snap.dieYield * 100) : 75}%** die yield, the program secures a solid **${snap.grossMargin ? Math.round(snap.grossMargin) : 60}%** gross margin. The program balances advanced electrical performance with solid manufacturing reliability, achieving a break-even threshold of **${snap.breakEvenVolumeMillion ? snap.breakEvenVolumeMillion.toFixed(2) : '2.0'} million units**.

### **Technical Architecture Analysis**
- **Node Choice**: Selecting **${dm.processNode}** offers excellent gate density and power efficiency, but early-stage production introduces minor defect risks.
- **Topology & Reticle Constraints**: The **${dm.topology}** topology represents a calculated choice. ${dm.topology === 'chiplet' ? `By separating compute cores into ${dm.chipletCount} smaller dies (${dm.dieArea} mm² each), you bypass reticle limit yield penalties.` : `The monolithic layout of ${dm.dieArea} mm² simplifies packaging, avoiding multi-die alignment costs.`}
- **Power Optimization**: Operating at TDP **${dm.tdp}W** results in power density **${snap.tdpPowerDensity ? snap.tdpPowerDensity.toFixed(3) : '0.1'} W/mm²**.

### **Manufacturing & Risk Report**
- **Defect Density (D0)**: Operating at **${dm.defectDensity} defects/cm²** indicates a mature process line.
- **Advanced Packaging & Test**: Packaging yield at **${dm.packagingYield}%** with test coverage at **${dm.testYield}%**.

### **Financial Sensitivity Summary**
- **Break-Even Analysis**: Amortizing **$${dm.nreCost}M** NRE requires **${snap.breakEvenVolumeMillion ? snap.breakEvenVolumeMillion.toFixed(2) : '2.10'} million units** at ASP **$${dm.asp}**.
- **Margin Sensitivity**: Unit cost **$${snap.grossCostPerGoodDie ? snap.grossCostPerGoodDie.toFixed(2) : '85.00'}**, 10% ASP drop compresses margins **${snap.grossMargin ? (snap.grossMargin * 0.1).toFixed(1) : '6.5'}%**.`,
        isDemo: true,
      });
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
- Packaged Unit Cost: $${snap.grossCostPerGoodDie}
- Gross Margin: ${snap.grossMargin}%
- Net Program Profit: $${snap.lifetimeNetProfitMillion} Million
- ROI: ${snap.roi}%
- Break-Even Volume: ${snap.breakEvenVolumeMillion} Million Units

Generate a board-ready executive report using clean markdown. Divide into these exact sections with H3 headings:
1. ### **Executive Briefing** (3 concise sentences on yield vs. margin optimization, ROI, commercial viability)
2. ### **Technical Architecture Analysis** (node choice, transistor density, power density, monolithic vs. chiplet trade-offs)
3. ### **Manufacturing & Risk Report** (D0, assembly yields, testing times, yield-curve risks)
4. ### **Financial Sensitivity Summary** (NRE amortization, break-even volumes, ASP sensitivity)

Numbers must correspond exactly to the inputs provided.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { temperature: 0.2 },
    });

    res.json({ analysis: response.text || 'No response generated.', isDemo: false });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Error during AI analysis.' });
  }
}
