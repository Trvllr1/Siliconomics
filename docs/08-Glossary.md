# 08 — Glossary of Terms & Acronyms

Canonical definitions for every acronym and domain term used across Siliconomics — the platform docs, the Formula Library, and the build workspace. Chippie cites these definitions verbatim when a persona asks what a term means.

### OSAT (Outsourced Semiconductor Assembly and Test)

OSAT stands for Outsourced Semiconductor Assembly and Test. OSATs are third-party companies (e.g., ASE, Amkor, JCET) that take finished wafers from a foundry and perform packaging assembly and electrical test on behalf of the chip designer. In Siliconomics, the per-unit packaging assembly cost (C_pkg) and tester time cost rate (R_test) in the Packaging & Test Cost formula come from OSAT price schedules.

### Foundry

A foundry is a semiconductor fabrication plant operator (e.g., TSMC, Samsung Foundry, GlobalFoundries) that manufactures wafers for fabless chip designers. The wafer cost input in every Siliconomics build reflects the foundry's price per processed wafer at the selected process node.

### ASP (Average Selling Price)

ASP is the Average Selling Price — the expected per-unit revenue for the finished chip. In Siliconomics, ASP drives gross margin, operating margin, break-even volume, and lifetime net profit.

### NRE (Non-Recurring Engineering)

NRE stands for Non-Recurring Engineering — the one-time development cost of a chip program: design, verification, mask sets, tooling, and software. NRE is amortized across lifetime volume; it is the fixed-cost side of the break-even volume calculation.

### ROI (Return on Investment)

ROI is Return on Investment: lifetime net profit divided by total program investment (primarily NRE), expressed as a percentage. In Siliconomics it is computed by the deterministic engine from lifetime net profit and NRE.

### TDP (Thermal Design Power)

TDP is Thermal Design Power — the sustained power (in watts) the chip's cooling solution must dissipate. Together with die area it defines power density (W/mm²), a key thermal feasibility signal.

### DPW (Dies Per Wafer)

DPW is Dies Per Wafer — the number of whole die candidates that geometrically fit on a wafer, computed from die dimensions and wafer diameter using the geometric packing standard. Net good dies per wafer = DPW × effective yield.

### KGD (Known Good Die)

KGD stands for Known Good Die — a die that has passed testing before being committed to a package. KGD semantics matter for chiplet builds: die (sort) yield is applied per chiplet before assembly, and package/test yields are applied after.

### Defect Density (D0)

Defect density (D0) is the average number of manufacturing defects per square centimeter of wafer area at a given process node. It is the dominant input to the Murphy die yield model: larger dies and higher D0 both reduce yield. Improving (lowering) D0 raises die yield.

### Yield Models (Murphy, Poisson, Seeds)

Die yield models translate die area and defect density into the fraction of defect-free dies. The Poisson model is pessimistic for large dies, the Seeds model optimistic, and the Murphy model — used by the Siliconomics engine — is the industry-standard intermediate that accounts for clustered defect distributions: Y = ((1 − e^(−A×D0)) / (A×D0))².

### WSPM (Wafer Starts Per Month)

WSPM is Wafer Starts Per Month — the number of wafers a program begins fabricating monthly. It caps monthly unit production: monthly units = WSPM × net good dies per wafer.

### BOM (Bill of Materials)

BOM is the Bill of Materials — the itemized list of components and costs that make up a product. In Siliconomics, the Architecture BOM view decomposes a build into dies, interposer, package, and test cost elements.

### MPW (Multi-Project Wafer)

MPW is a Multi-Project Wafer — a shared wafer run where multiple designs split mask and wafer costs, used to cut prototyping NRE before committing to dedicated production masks.

### Tape-Out

Tape-out is the milestone when the final chip design database is released to the foundry for mask making. After tape-out, design changes require new masks (a respin), which incurs significant NRE. Siliconomics flags builds approaching tape-out review.

### Process Node

The process node (e.g., 7nm, 5nm, 3nm) names a foundry manufacturing generation. Smaller nodes offer higher transistor density and better power efficiency but carry higher wafer cost, higher initial defect density, and higher NRE.

### Chiplet

A chiplet is a small functional die designed to be combined with other dies in one package, as opposed to a monolithic (single-die) design. Chiplet topologies improve yield on large systems (smaller dies yield better) at the price of packaging complexity, interposer cost, and assembly yield loss.

### Interposer

An interposer is a silicon or organic substrate that routes signals between chiplets in an advanced package. Its area and cost are explicit inputs for chiplet-topology builds in Siliconomics.

### CoWoS (Chip-on-Wafer-on-Substrate)

CoWoS is TSMC's 2.5D advanced packaging technology that mounts chiplets on a silicon interposer, then on a substrate. It is a common choice for HPC/AI chips; its assembly cost appears in advanced packaging cost inputs.

### EMIB (Embedded Multi-die Interconnect Bridge)

EMIB is Intel's 2.5D packaging approach that uses small embedded silicon bridges instead of a full interposer to connect adjacent dies, generally lowering packaging cost versus full-interposer solutions.

### SoC (System on Chip)

An SoC integrates the major functions of a system — compute cores, memory controllers, I/O, accelerators — on a single die. Manhattan-X1 (ADAS SoC) is an SoC build.

### ASIC (Application-Specific Integrated Circuit)

An ASIC is a chip designed for one specific application rather than general-purpose use. The archetype registry includes ASIC reference profiles.

### FPGA (Field-Programmable Gate Array)

An FPGA is a reprogrammable logic device configured after manufacturing. FPGAs trade higher unit cost and power for zero mask NRE and field flexibility.

### SRAM (Static Random-Access Memory)

SRAM is the fast on-die memory used for caches. SRAM density scaling has slowed at advanced nodes, which shifts die area economics for cache-heavy designs.

### EDA (Electronic Design Automation)

EDA refers to the software tools (e.g., Synopsys, Cadence) used to design and verify chips. EDA licenses are a major component of NRE.

### SIA (Semiconductor Industry Association)

SIA is the Semiconductor Industry Association, the U.S. industry trade body. Siliconomics formula standards reference SIA industry blueprints for modeling conventions (e.g., Murphy-SIA formula versions).

### NPV (Net Present Value)

NPV is Net Present Value — future cash flows discounted to today's value. Used in program-level financial comparisons alongside lifetime net profit.

### WACC (Weighted Average Cost of Capital)

WACC is the Weighted Average Cost of Capital — the blended rate a company pays to finance itself, used as the discount rate in NPV calculations.

### GTM (Go-To-Market)

GTM is Go-To-Market — the commercial launch strategy for a product: positioning, pricing, channels, and customer targeting.

### ICP (Ideal Customer Profile)

ICP is the Ideal Customer Profile — the archetype of customer that gains the most value from the product; used in GTM planning.

### PMF (Product-Market Fit)

PMF is Product-Market Fit — the point where a product satisfies strong market demand, evidenced by retention and organic pull.

### FCL (Founder's Constitutional Law)

FCL is Siliconomics' Founder's Constitutional Law — the governing document (docs/00-FCL_v1.md) that defines the platform's non-negotiable principles, including deterministic provenance: every number must trace to the engine and Formula Library.

### OEM (Original Equipment Manufacturer)

An OEM is a company that builds end products (vehicles, servers, phones) incorporating chips. OEM design wins anchor the target volume assumptions in a build.

### ISO 26262

ISO 26262 is the international functional safety standard for automotive electronics. Automotive builds like Manhattan-X1 carry ISO 26262 as their audit standard, which constrains process choices and documentation rigor.

### CFO (Chief Financial Officer) and Persona Roles

Siliconomics personas map to program roles: architect (engineering inputs), manufacturing (yield and fab inputs), finance/CFO (cost, ASP, NRE), program manager (schedule, volume), and executive (read-mostly decision view). Field ownership determines who may apply a proposed assumption change.
