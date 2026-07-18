// GTM deliverables PDF generator — run: node gtm-deliverables/generate-gtm-pdfs.mjs
// Produces four founder-facing GTM documents as PDFs in this folder.
// Uses the repo's existing jspdf dependency. Not part of the app build.
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 64;

const INK = [17, 24, 39]; // near-black
const SLATE = [71, 85, 105];
const BLUE = [29, 78, 216];
const CRIMSON = [153, 27, 27];
const LIGHT = [241, 245, 249];

function makeDoc(docTitle, subtitle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const ensure = (space) => {
    if (y + space > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const api = {
    doc,
    title(text) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(text, CONTENT_W);
      doc.text(lines, MARGIN, y + 16);
      y += 16 + lines.length * 22;
      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(...SLATE);
        const sub = doc.splitTextToSize(subtitle, CONTENT_W);
        doc.text(sub, MARGIN, y);
        y += sub.length * 13 + 4;
      }
      doc.setDrawColor(...BLUE);
      doc.setLineWidth(1.4);
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
      y += 18;
    },
    h2(text) {
      ensure(46);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...BLUE);
      doc.text(text, MARGIN, y + 10);
      y += 22;
    },
    h3(text) {
      ensure(34);
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.text(text, MARGIN, y + 9);
      y += 19;
    },
    p(text, opts = {}) {
      doc.setFont('helvetica', opts.italic ? 'italic' : 'normal');
      doc.setFontSize(opts.size ?? 10);
      doc.setTextColor(...(opts.color ?? INK));
      const lines = doc.splitTextToSize(text, CONTENT_W);
      for (const line of lines) {
        ensure(13);
        doc.text(line, MARGIN, y + 9);
        y += 13;
      }
      y += opts.after ?? 6;
    },
    bullet(text, indent = 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      const x = MARGIN + 14 + indent;
      const lines = doc.splitTextToSize(text, CONTENT_W - 14 - indent);
      ensure(13);
      doc.setFillColor(...BLUE);
      doc.circle(MARGIN + 5 + indent, y + 5.5, 1.6, 'F');
      for (const line of lines) {
        ensure(13);
        doc.text(line, x, y + 9);
        y += 13;
      }
      y += 3;
    },
    warn(text) {
      const lines = doc.splitTextToSize(text, CONTENT_W - 24);
      const h = lines.length * 13 + 18;
      ensure(h + 6);
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(...CRIMSON);
      doc.setLineWidth(0.8);
      doc.roundedRect(MARGIN, y, CONTENT_W, h, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...CRIMSON);
      doc.text(lines, MARGIN + 12, y + 15);
      y += h + 12;
    },
    table(headers, rows, widths) {
      const total = widths.reduce((a, b) => a + b, 0);
      const scale = CONTENT_W / total;
      const cols = widths.map((w) => w * scale);
      const pad = 5;

      const drawRow = (cells, bold, fill) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        const wrapped = cells.map((c, i) => doc.splitTextToSize(String(c), cols[i] - pad * 2));
        const rowH = Math.max(...wrapped.map((w) => w.length)) * 10.5 + pad * 2;
        ensure(rowH);
        let x = MARGIN;
        for (let i = 0; i < cells.length; i++) {
          if (fill) {
            doc.setFillColor(...LIGHT);
            doc.rect(x, y, cols[i], rowH, 'F');
          }
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.rect(x, y, cols[i], rowH, 'S');
          doc.setTextColor(...(bold ? BLUE : INK));
          doc.text(wrapped[i], x + pad, y + pad + 7.5);
          x += cols[i];
        }
        y += rowH;
      };

      drawRow(headers, true, true);
      for (const row of rows) drawRow(row, false, false);
      y += 10;
    },
    spacer(n = 8) {
      y += n;
    },
    save(filename) {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE);
        doc.text(`Siliconomics — ${docTitle} — Confidential`, MARGIN, PAGE_H - 36);
        doc.text(`2026-07-17  ·  Page ${i} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 36, { align: 'right' });
      }
      const buf = Buffer.from(doc.output('arraybuffer'));
      writeFileSync(join(OUT_DIR, filename), buf);
      console.log(`Wrote ${filename} (${(buf.length / 1024).toFixed(0)} KB, ${pages} pages)`);
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// 1. Design-Partner Target Scoring Template
// ---------------------------------------------------------------------------
{
  const d = makeDoc(
    'Design-Partner Target Scoring',
    'Qualification gates, weighted scoring rubric, and working list template for the 25-account design-partner pipeline.'
  );
  d.title('Design-Partner Target List — Scoring Template');

  d.h2('Purpose');
  d.p(
    'Select 5 design partners from a scored pool of ~25 candidate accounts. Partners receive a 6-month free partnership; ' +
      'in return we get weekly feedback, assumption validation, and (on conversion) a citable case study. ' +
      'The single success metric per partner: a Siliconomics Build is cited in a real gate review or board deck.'
  );

  d.h2('Qualification Gates (all four required — score only accounts that pass)');
  d.bullet('G1 — Active decision: a real silicon program decision (node, topology, packaging, make/buy) lands within the next 2 quarters.');
  d.bullet('G2 — Executive sponsor: a VP-level sponsor commits to one review session per month.');
  d.bullet('G3 — Validation willingness: agrees to compare Siliconomics outputs against internal numbers (without sharing NDA data with us).');
  d.bullet('G4 — Competitive isolation: not a direct competitor of an already-signed partner.');

  d.h2('Scoring Rubric (weighted, 0–2 per criterion)');
  d.table(
    ['Criterion', 'Wt', 'Score 0', 'Score 1', 'Score 2'],
    [
      ['Decision imminence', '25%', 'No decision in 12 mo', 'Decision in 2–4 quarters', 'Decision this or next quarter'],
      ['Exec sponsor access', '20%', 'No warm path to VP+', 'Intro possible via network', 'Direct relationship with sponsor'],
      ['Segment fit (see tiers)', '20%', 'Outside ICP', 'Tier 2–3 fit', 'Tier 1: first-silicon system company'],
      ['Feedback capacity', '15%', 'No bandwidth', 'Ad-hoc responses only', 'Weekly 30-min committed'],
      ['Reference value', '10%', 'Cannot be named', 'Private reference only', 'Public logo + case study likely'],
      ['Competitive isolation', '10%', 'Conflicts with partner', 'Adjacent overlap', 'Clean'],
    ],
    [110, 30, 110, 120, 120]
  );

  d.h3('Interpretation');
  d.bullet('Weighted score >= 1.60 — pursue immediately (target: top 8 accounts).');
  d.bullet('1.20 – 1.59 — nurture; re-score monthly as programs mature.');
  d.bullet('< 1.20 — park; revisit next quarter.');

  d.h2('Segment Guidance');
  d.table(
    ['Tier', 'Profile', 'Entry persona', 'Why they buy'],
    [
      [
        'Tier 1',
        'First-silicon system companies: AI hardware startups, hyperscaler-adjacent silicon teams, automotive OEM silicon divisions',
        'VP Silicon / Chief Architect',
        'Making the chiplet-vs-monolithic / node / packaging call now, without institutional cost models',
      ],
      [
        'Tier 2',
        'Tier-2 fabless and chiplet-era SMEs',
        'Program Director / CFO',
        'Have spreadsheets, lack auditability; need board-credible program reviews',
      ],
      [
        'Tier 3',
        'Silicon design-services firms; deep-tech VCs doing silicon diligence',
        'Engagement lead / Partner',
        'One license, many engagements; loudest references',
      ],
    ],
    [45, 190, 105, 150]
  );
  d.p('Not targets for v1: top-10 fabless (internal models, 18-month procurement), foundries (data-neutrality conflict), academia.', {
    italic: true,
    color: SLATE,
  });

  d.h2('Sourcing Pools');
  d.bullet('Founder network and investor intros (highest conversion — start here).');
  d.bullet('Chiplet Summit, OCP Summit, DAC corridor conversations.');
  d.bullet('LinkedIn silicon-economics community engagement (via teardown posts).');
  d.bullet('Inbound from demo mode + published teardowns (tag source in the worksheet).');

  d.h2('Working List (duplicate this sheet as needed — 10 rows per page)');
  const blank = Array.from({ length: 10 }, (_, i) => [`${i + 1}.`, '', '', '', '', '']);
  d.table(['#', 'Company / Contact', 'Tier', 'Gates G1–G4 (Y/N)', 'Weighted score', 'Next action / owner / date'], blank, [
    22, 150, 35, 90, 60, 135,
  ]);

  d.h3('Cadence');
  d.bullet('Score weekly; hold a 30-minute pipeline review every Friday.');
  d.bullet('Target: 25 scored accounts, 8 active conversations, 5 signed partners by end of Q+1.');

  d.save('01-design-partner-target-scoring.pdf');
}

// ---------------------------------------------------------------------------
// 2. Partner Outreach Kit
// ---------------------------------------------------------------------------
{
  const d = makeDoc(
    'Partner Outreach Kit',
    'Positioning, sequenced outreach templates, objection cards, and the qualification-call agenda for design-partner recruitment.'
  );
  d.title('Design-Partner Outreach Kit');

  d.h2('Positioning (use verbatim)');
  d.p(
    '"Siliconomics is the decision system for silicon economics — deterministic, auditable program modeling for teams making ' +
      '$100M+ chip decisions without $100M of tribal knowledge."'
  );
  d.bullet('Computes, does not guess — deterministic engine, golden-test-locked, versioned formulas.');
  d.bullet('Every number defends itself — sourced, dated, confidence-rated assumptions; full calculation traces.');
  d.bullet('Decisions with a paper trail — immutable frozen Builds, content hashes, decision log.');
  d.bullet('Programs, not snapshots — quarterly P&L, yield ramp, ASP erosion, respin risk, supply-vs-demand.');

  d.h2('Rules of Engagement');
  d.bullet('Personalize with THEIR program economics — lead with a modeled insight, never a feature list.');
  d.bullet('Never claim access to foundry pricing. Our stance: public/analyst estimates shipped; their private numbers stay theirs.');
  d.bullet('No spray-and-pray. Max 25 accounts, 3 touches each, then stop.');
  d.bullet('Every email must be sendable in under 90 seconds of reading time.');

  d.h2('Touch 1A — Cold email, VP Silicon / Chief Architect angle');
  d.p('Subject options: "Your interposer probably costs more than your silicon"  /  "[Company]\'s chiplet math, modeled"', {
    italic: true,
    color: SLATE,
  });
  d.p(
    'Hi [Name] — teams doing their first [N3/advanced-node] program usually discover late that the CoWoS interposer, not the silicon, ' +
      'dominates unit cost. We built a deterministic model of exactly that trade: chiplet-vs-monolithic, KGD yield stacking, ' +
      'packaging economics — every assumption sourced and dated, every number traceable to its formula.\n\n' +
      'We are selecting 5 design partners (6 months, free, direct founder access) whose programs face this decision in the next two quarters. ' +
      'In exchange: 30 minutes of feedback a week and an honest comparison against your internal numbers.\n\n' +
      'Here is a live teardown you can inspect without signing in: [demo link]. Worth 20 minutes with your program lead?'
  );

  d.h2('Touch 1B — Cold email, CFO / Program Director angle');
  d.p('Subject options: "The board deck number nobody can reproduce"  /  "Auditable silicon economics for [program]"', {
    italic: true,
    color: SLATE,
  });
  d.p(
    'Hi [Name] — when a $260M silicon program gets approved, can anyone later show which assumptions, formula versions, and data vintage ' +
      'produced the numbers the board saw? In most organizations that lives in one architect\'s spreadsheet.\n\n' +
      'Siliconomics freezes every approved scenario with a content hash, its exact formulas, and dated cost assumptions — ' +
      'a decision paper-trail for silicon programs. We are taking 5 design partners this quarter, free for 6 months.\n\n' +
      'May I show you a 20-minute walkthrough using a program shaped like yours?'
  );

  d.h2('Touch 2 — Follow-up (day +5)');
  d.p(
    'Hi [Name] — sharing our latest teardown: a deterministic COGS model of an AI-server accelerator (4-chiplet N3-class, CoWoS-S). ' +
      'The interposer alone models out near $2,800/unit — more than all silicon dies combined. Full methodology and interactive model: [link].\n\n' +
      'If [Company]\'s packaging trade looks anything like this, the design-partner slot is a fit. Two slots remain for [quarter].'
  );

  d.h2('Touch 3 — Close-out (day +12)');
  d.p(
    'Hi [Name] — closing the loop; we are finalizing the design-partner cohort this month. If the timing is wrong I will stop here — ' +
      'but if [program] is making its node/packaging call later this year, reply "later" and I will come back when the cohort reopens.'
  );

  d.h2('LinkedIn Connect Note (under 300 characters)');
  d.p(
    '[Name] — we model silicon program economics deterministically (yield ramp, chiplet vs monolithic, CoWoS cost). ' +
      'Selecting 5 design partners this quarter. Your [program/talk/post] suggests this is your exact problem. Open to comparing notes?'
  );

  d.h2('30-Second Corridor Pitch');
  d.p(
    '"Every chip company runs its billion-dollar decisions on one architect\'s spreadsheet. We built the audit-grade version: ' +
      'deterministic silicon economics — yield, chiplets, packaging, quarterly P&L — every number traceable to a sourced assumption ' +
      'and a versioned formula. Free demo runs entirely in your browser; nothing leaves your machine. Want the link?"'
  );

  d.h2('Objection Cards');
  d.table(
    ['Objection', 'Response'],
    [
      [
        '"Our spreadsheet already does this."',
        'Can it show an auditor which formula version and data vintage produced the number your board approved last March? Frozen Builds + provenance can.',
      ],
      [
        '"Your cost numbers cannot be right — you do not have our foundry pricing."',
        'Correct, and by design. Every assumption is sourced, dated, confidence-rated — and editable. Load your NDA numbers locally; we never see them. The model, not the constants, is the product.',
      ],
      [
        '"Is this AI-generated?"',
        'No. Deterministic, test-locked computation. The AI advisor only reads results; it never produces numbers.',
      ],
      [
        '"Security? You want our unannounced chip specs."',
        'Demo mode is fully local — zero transmission. Hosted mode is tenant-isolated with documented data handling. Happy to route our data-handling one-pager to your security review.',
      ],
    ],
    [140, 340]
  );

  d.h2('Qualification Call Agenda (30 minutes)');
  d.bullet('0–5 min: their program — decision, timeline, who signs off. (Confirms gates G1/G2.)');
  d.bullet('5–15 min: live model of a program shaped like theirs — end on the explainability panel and audit export.');
  d.bullet('15–22 min: partnership terms — what they get, what we ask (weekly 30 min, monthly exec review, validation comparison).');
  d.bullet('22–27 min: their objections; use cards above. Confirm gate G3.');
  d.bullet('27–30 min: next step — named sponsor, term-sheet outline sent same day, start date proposed.');

  d.h3('The one metric to establish on the call');
  d.p('"Success for both of us is one thing: a Siliconomics Build cited in one of your real gate reviews. Fair?"', { italic: true });

  d.save('02-design-partner-outreach-kit.pdf');
}

// ---------------------------------------------------------------------------
// 3. Teardown Draft #01
// ---------------------------------------------------------------------------
{
  const d = makeDoc(
    'Teardown Draft 01',
    'Draft for the first public silicon-economics teardown post. All figures are modeled estimates from public and analyst-published data.'
  );
  d.title('Teardown #01 — What Does an AI-Server Accelerator Actually Cost to Build?');

  d.p(
    'DRAFT v0.1 for founder review. Publication targets: company blog, LinkedIn, HN. Embed the interactive demo Build via share link before publishing.',
    { italic: true, color: SLATE }
  );

  d.h2('Standfirst');
  d.p(
    'AI accelerator pricing is public. Cost structure is not. Below we build one, deterministically: a 4-chiplet, N3-class, ' +
      'CoWoS-packaged AI-server accelerator, modeled end to end with every assumption sourced, dated, and confidence-rated — ' +
      'and every output traceable to a named formula. No black boxes; you can open the live model and change any number.'
  );

  d.h2('The Build');
  d.bullet('4 × 145 mm² compute chiplets, N3-class node (analyst-estimate wafer price: $18,000; defect density 0.12/cm²).');
  d.bullet('1 × I/O die on a mature node.');
  d.bullet('CoWoS-S silicon interposer, ~760 mm², modeled at $3.50/mm² with 96% assembly yield.');
  d.bullet('HBM stacks excluded from this teardown (memory economics deserve their own issue — subscribe).');

  d.h2('Step 1 — Silicon: why chiplets win the yield war');
  d.p(
    'Murphy\'s yield model at N3-class defect density gives a 145 mm² chiplet roughly 84% yield. A hypothetical monolithic ' +
      '~600 mm² version of the same design yields dramatically worse — this is the entire economic argument for disaggregation. ' +
      'But chiplets must ALL be good: four compute dies plus I/O stacked multiplicatively (known-good-die flow) put compound silicon ' +
      'yield in the 40–50% band before packaging. Disaggregation buys per-die yield and spends some of it back on compounding.'
  );

  d.h2('Step 2 — The punchline: the interposer out-costs the silicon');
  d.p(
    'A ~760 mm² CoWoS-S interposer at $3.50/mm², divided by its 96% assembly yield, models to roughly $2,770 per unit. ' +
      'That is more than all five silicon dies combined. In the advanced-packaging era, the package is the product. ' +
      'This single line item is why CoWoS allocation — not wafer supply — is the binding constraint on AI accelerator volume.'
  );

  d.h2('Step 3 — The unit stack (modeled estimates)');
  d.table(
    ['Cost element', 'Modeled $/unit (approx.)', 'Notes'],
    [
      ['Compute + I/O silicon (KGD-adjusted)', '~$400–500', 'Murphy yield per die; compound KGD flow'],
      ['CoWoS-S interposer (yield-adjusted)', '~$2,770', '760 mm² × $3.50/mm² ÷ 0.96'],
      ['Assembly, substrate, final test', '~$70–100', 'Incl. test seconds × cost/second'],
      ['Total unit COGS', '~$3,200', 'Before NRE amortization'],
    ],
    [180, 120, 180]
  );

  d.h2('Step 4 — Program economics');
  d.bullet('At an $8,500 ASP (H100/MI300-class market), gross margin models to ~62%.');
  d.bullet('NRE: ~$260M (masks, IP, design + verification labor) → break-even near 54,000 units — weeks of production at AI-demand run rates.');
  d.bullet(
    'The time dimension matters more than the point estimate: defect-density learning curves, ASP erosion, and a 35%-probability respin ' +
      'scenario (mask set + 2 quarters) all shift the answer. The interactive model computes all three.'
  );

  d.h2('What this means');
  d.bullet('If you are choosing between monolithic and chiplets at advanced nodes, the decision is a packaging-economics decision.');
  d.bullet('Supply-constrained programs should model CoWoS allocation as the demand ceiling, not wafer starts.');
  d.bullet('Any cost model without yield ramp and respin probability is a snapshot, not a plan.');

  d.h2('Open the model');
  d.p(
    'Every number above comes from a deterministic Build you can open, inspect, and edit in your browser — no sign-in, nothing transmitted: ' +
      '[DEMO SHARE LINK]. Click any metric for its formula, inputs, assumptions, and data vintage.'
  );

  d.h2('Sources & confidence');
  d.p(
    'Wafer pricing, defect density, and CoWoS cost assumptions are analyst estimates and published disclosures (medium confidence, dated in-model). ' +
      'No NDA-covered foundry pricing is used — by policy. Methodology (Murphy yield, KGD semantics, packaging cost model) is documented openly in the app\'s formula library.',
    { italic: true, color: SLATE }
  );

  d.save('03-teardown-draft-ai-accelerator-cogs.pdf');
}

// ---------------------------------------------------------------------------
// 4. Design-Partner Term Sheet Outline
// ---------------------------------------------------------------------------
{
  const d = makeDoc(
    'Design-Partner Term Sheet Outline',
    'Business-terms outline for the 6-month design-partner program. For counsel review before any use.'
  );
  d.title('Design-Partner Program — Term Sheet Outline');

  d.warn(
    'NOT A CONTRACT AND NOT LEGAL ADVICE. This is a business-terms outline to hand to counsel for drafting. ' +
      'Do not sign or circulate as an agreement.'
  );

  d.h2('1. Parties & Purpose');
  d.p(
    'Siliconomics ("Company") and [Partner] enter a design partnership to deploy the Siliconomics platform on Partner\'s active ' +
      'silicon program(s), validate its models against Partner\'s internal analyses, and shape the product roadmap.'
  );

  d.h2('2. Term');
  d.bullet('6 months from effective date. Either party may terminate with 14 days written notice, no cause required.');
  d.bullet('One 3-month extension by mutual written consent.');

  d.h2('3. What Partner Receives');
  d.bullet('Full platform access for up to 5 named users, at no cost during the term.');
  d.bullet('Direct founder/CTO access: weekly 30-minute working session; same-day response channel.');
  d.bullet('Assumption onboarding: Partner\'s own reference data loaded as private, partner-owned models.');
  d.bullet('Priority consideration for feature requests arising from Partner\'s program needs.');
  d.bullet('Price lock: first right to convert to an annual team license at $36,000/year, held for 12 months from term end.');

  d.h2('4. What Company Receives');
  d.bullet('Weekly feedback session participation (30 minutes, program-level user).');
  d.bullet('Executive sponsor attendance at one monthly review.');
  d.bullet('Validation comparisons: Partner compares platform outputs to internal figures and reports deltas — without disclosing NDA-covered source data to Company.');
  d.bullet('On conversion to paid: a case study and reference call; logo usage by separate written approval only.');

  d.h2('5. Data Handling & Confidentiality');
  d.bullet('Partner-entered assumptions and Builds are Partner\'s confidential information; tenant-isolated; never aggregated, benchmarked, or shared.');
  d.bullet('Company never requests, receives, or stores NDA-covered foundry/vendor pricing. Validation is delta-based, not data-based.');
  d.bullet('Demo/local mode processes data entirely in-browser with no server transmission.');
  d.bullet('AI-advisor features transmit Build parameters to a third-party LLM API only on explicit per-use invocation; Partner may disable account-wide.');
  d.bullet('Mutual NDA executed as a separate instrument; survives termination.');

  d.h2('6. Intellectual Property');
  d.bullet('Company owns the platform, models, formulas, and all improvements.');
  d.bullet('Partner owns its data, assumptions, designs, and Builds.');
  d.bullet('Partner grants Company a perpetual, royalty-free license to use feedback and feature suggestions without attribution or compensation.');
  d.bullet('No rights to Partner\'s silicon designs or product plans are granted or implied.');

  d.h2('7. Service Level');
  d.bullet('Platform provided AS-IS during the partnership term; no uptime SLA, no warranty.');
  d.bullet('Company commits to commercially reasonable efforts on defect resolution, with priority over non-partner issues.');

  d.h2('8. Model Outputs Disclaimer');
  d.bullet('Outputs are deterministic computations over Partner-controlled and Company-published assumptions.');
  d.bullet('Outputs are decision-support information, not professional advice; Partner is solely responsible for business decisions.');
  d.bullet('Company-published reference data is estimate-grade and provenance-labeled; accuracy of Partner-entered data is Partner\'s responsibility.');

  d.h2('9. Exclusivity & Publicity');
  d.bullet('Non-exclusive for both parties. Company limits cohort to 5 partners and will not sign Partner\'s named direct competitor during the term (competitor list attached as Exhibit A).');
  d.bullet('Neither party issues press or public statements about the partnership without written approval.');

  d.h2('10. Success Criteria (non-binding, for mutual accountability)');
  d.bullet('A Siliconomics Build is cited in at least one of Partner\'s real gate reviews or board materials during the term.');
  d.bullet('Model-vs-internal validation deltas reviewed jointly at months 2, 4, and 6.');
  d.bullet('Conversion decision meeting scheduled no later than 30 days before term end.');

  d.h2('11. Liability');
  d.bullet('Liability cap: fees paid (zero during free term) or a nominal fixed amount as counsel advises; mutual exclusion of consequential damages.');

  d.h2('12. Signature Block');
  d.p('[Company signatory, title, date]      [Partner signatory, title, date]', { color: SLATE });

  d.save('04-design-partner-term-sheet-outline.pdf');
}

console.log('All GTM deliverables generated.');
