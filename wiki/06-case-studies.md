# Real-World Case Studies

## Case Study 1: Netflix — Greenfield Cloud Migration

### Background
- Netflix started as a DVD-by-mail service with traditional data center infrastructure
- In 2008, a major database corruption caused a 3-day outage
- Decision: Migrate entirely to AWS (greenfield cloud architecture)

### Approach: Greenfield
- Built entirely new cloud-native architecture from scratch on AWS
- Designed for horizontal scaling, fault tolerance, and global distribution
- Created new tools and practices (Chaos Monkey, microservices at scale)

### Timeline
- 2008: Decision to move to cloud
- 2008-2015: 7-year migration (gradual, not big-bang)
- 2016: Completed shutdown of last data center

### Results
- **Scalability**: From millions to 200M+ subscribers globally
- **Reliability**: 99.99% uptime
- **Innovation speed**: Deploy thousands of times per day
- **Industry impact**: Open-sourced dozens of tools (Netflix OSS)

### Key Lesson
Even "greenfield" migrations take years when done responsibly. Netflix ran both systems in parallel for 7 years.

---

## Case Study 2: UK Government — GOV.UK (Greenfield)

### Background
- UK government had 750+ separate websites, each with different designs and technology
- Citizens couldn't find information, departments duplicated effort

### Approach: Greenfield
- Built GOV.UK as a completely new platform from scratch
- Started with a small agile team (Government Digital Service)
- Used modern tech: Ruby on Rails, cloud hosting, responsive design

### Timeline
- 2011: GDS formed
- 2012: GOV.UK launched (alpha → beta → live)
- 2014: Most department sites migrated

### Results
- Consolidated 750+ sites into one
- Saved £60M+ in first 2 years
- User satisfaction increased dramatically
- Became a model for digital government worldwide

### Key Lesson
Greenfield can work at massive government scale when led by a focused team with executive support and a clear user need.

---

## Case Study 3: Commonwealth Bank of Australia — Brownfield Modernization

### Background
- Core banking system built on 1980s mainframe technology
- Processing millions of transactions daily
- Cannot afford downtime — people's money depends on it

### Approach: Brownfield (Progressive Modernization)
- Wrapped legacy systems with modern APIs
- Built new customer-facing apps (greenfield) that connect to modernized core
- Replaced components one at a time over many years

### Timeline
- 2008: $750M modernization program began
- 2008-2012: Core banking platform replaced (SAP-based)
- 2012-present: Continuous modernization layers added

### Results
- Became Australia's most innovative bank
- Real-time payments and modern app experience
- Core system reliability maintained throughout
- No customer-impacting outages during migration

### Key Lesson
For mission-critical systems, brownfield modernization (wrapping and replacing gradually) is safer than big-bang replacement.

---

## Case Study 4: Spotify — Hybrid Approach

### Background
- Rapid growth from startup to 500M+ users
- Architecture evolved organically, creating technical debt
- Need to scale while maintaining developer velocity

### Approach: Hybrid (Greenfield microservices, Brownfield core)
- Kept working systems running (brownfield)
- Built new services for new features (greenfield)
- Created internal platform (Backstage) to manage complexity
- Eventually replaced legacy components when they became bottlenecks

### Results
- Maintained rapid feature development
- Scaled to 500M+ users across 180+ markets
- Open-sourced Backstage (now a CNCF project)
- Developer productivity remained high despite growth

### Key Lesson
The hybrid approach — maintaining what works while building new where needed — offers the best of both worlds for fast-growing companies.

---

## Case Study 5: Healthcare.gov — Greenfield Failure, Brownfield Recovery

### Background
- US government's health insurance marketplace
- October 2013 launch was a catastrophic failure

### Phase 1: Greenfield Failure
- Built from scratch by multiple contractors
- Insufficient testing and integration
- Site crashed on day one, barely functional for months
- **Root cause**: Greenfield project without adequate leadership, testing, or coordination

### Phase 2: Brownfield Recovery
- "Tech surge" team stabilized the existing system
- Incremental fixes applied to the running (broken) system
- Brownfield approach: improve what's there rather than start over again

### Results
- System stabilized within 2 months
- Eventually served 30M+ enrollments
- Lessons influenced government IT procurement reform

### Key Lesson
Greenfield is not automatically better. Without proper execution, it can fail spectacularly. Sometimes brownfield recovery is the pragmatic choice.

---

## Case Study 6: Amazon — Greenfield AWS

### Background
- Amazon's internal infrastructure was becoming a competitive advantage
- Engineers needed faster provisioning and deployment
- Idea: sell infrastructure as a service

### Approach: Greenfield (New Business Line)
- Built AWS as a completely new product (greenfield)
- Started with S3 (storage) and EC2 (compute) in 2006
- No constraints from Amazon's retail infrastructure

### Results
- AWS became the world's largest cloud provider
- $90B+ annual revenue (2023)
- Transformed the entire IT industry
- Enabled millions of other greenfield projects

### Key Lesson
Sometimes the biggest greenfield opportunity isn't replacing your existing product — it's creating an entirely new market.

---

## Patterns Across Case Studies

| Pattern | Examples |
|---------|----------|
| **Greenfield success requires** | Clear vision, strong leadership, adequate timeline |
| **Brownfield success requires** | Patience, incremental approach, deep domain knowledge |
| **Hybrid works when** | You can clearly separate new from existing |
| **Migration takes years** | Netflix (7 years), banks (5+ years), government (3+ years) |
| **Parallel running is essential** | Every successful migration ran old and new simultaneously |

## Navigation

- [← Why It's Trending](05-why-trending.md)
- [Modernization Strategies →](07-modernization-strategies.md)
- [Back to Home](../README.md)
