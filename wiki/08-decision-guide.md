# Decision Guide: Greenfield vs Brownfield

## The Framework

Use this systematic framework when faced with the "rebuild vs. modernize" decision.

## Step 1: Assess the Current System

Rate your existing system on these dimensions (1-5 scale):

### Technical Health Assessment

| Dimension | 1 (Critical) | 3 (Moderate) | 5 (Healthy) |
|-----------|--------------|--------------|-------------|
| **Code quality** | Unmaintainable spaghetti | Some issues, mostly manageable | Clean, well-structured |
| **Test coverage** | None | Partial (~50%) | Comprehensive (80%+) |
| **Documentation** | Non-existent | Outdated but exists | Current and useful |
| **Dependencies** | End-of-life, no updates | Supported but aging | Current, actively maintained |
| **Performance** | Constant outages | Occasional issues | Meets all SLAs |
| **Security** | Critical vulnerabilities | Some concerns | Up to date |
| **Scalability** | At maximum capacity | Can grow 2-3x | Elastic scaling |

**Scoring**:
- Total 7-15: System in critical condition → Consider greenfield
- Total 16-25: System manageable → Brownfield modernization likely appropriate
- Total 26-35: System healthy → Brownfield enhancement is clearly the right choice

### Business Value Assessment

| Question | Yes = Greenfield Signal | No = Brownfield Signal |
|----------|------------------------|----------------------|
| Are business requirements fundamentally different from what the system does? | ✓ | |
| Has the market changed so much that the system's core assumptions are wrong? | ✓ | |
| Is the system preventing the business from competing? | ✓ | |
| Would customers benefit more from a complete reimagination? | ✓ | |
| Is there a regulatory mandate requiring fundamental changes? | ✓ | |

## Step 2: Evaluate Organizational Readiness

### For Greenfield Readiness

| Factor | Ready | Not Ready |
|--------|-------|-----------|
| **Executive sponsorship** | Strong, long-term commitment | Short-term thinking |
| **Budget** | Multi-year funding secured | Annual budget only |
| **Team skills** | Modern tech expertise available | Only legacy knowledge |
| **Risk tolerance** | Can accept 12-18 month timeline | Need results in weeks |
| **Domain knowledge** | Well-documented business rules | Rules exist only in legacy code |

### For Brownfield Readiness

| Factor | Ready | Not Ready |
|--------|-------|-----------|
| **Legacy expertise** | Team knows the system | No one understands it |
| **System accessibility** | Source code available, documented | Black box, no docs |
| **Incremental deployment** | CI/CD possible | Requires quarterly releases |
| **Business continuity** | Can tolerate gradual changes | All-or-nothing requirement |
| **Testing** | Can add automated tests | System untestable |

## Step 3: Consider the Constraints

### Hard Constraints (Non-negotiable)

- **Budget ceiling**: Does greenfield cost exceed available budget?
- **Timeline**: Is there a hard deadline that only brownfield can meet?
- **Regulatory**: Are there compliance requirements that mandate one approach?
- **Contractual**: Are there vendor lock-in constraints?
- **Data sovereignty**: Can data be moved?

### Soft Constraints (Important but flexible)

- Team preferences
- Technology trends
- Competitor actions
- Market timing

## Step 4: Decision Tree

```
                        Start Here
                            │
                            ▼
                ┌───────────────────────┐
                │ Is the system causing  │
                │ business-critical      │
                │ failures?              │
                └───────────┬───────────┘
                     │              │
                    YES            NO
                     │              │
                     ▼              ▼
        ┌────────────────┐  ┌────────────────┐
        │ Can it be       │  │ Do requirements │
        │ stabilized      │  │ fundamentally   │
        │ quickly?        │  │ differ from     │
        └────────┬───────┘  │ current system? │
          │          │      └────────┬───────┘
         YES        NO        │          │
          │          │       YES        NO
          ▼          ▼        │          │
     Brownfield   Consider    ▼          ▼
     (stabilize   Greenfield  Consider   Brownfield
      first)      (with       Greenfield (enhance
                  careful     (but plan  incrementally)
                  migration)  carefully)
```

## Step 5: Plan the Approach

### If Greenfield:

1. **Document existing business rules** before touching code
2. **Define MVP** — what's the minimum viable replacement?
3. **Plan migration** — how will users and data transition?
4. **Set milestones** — 3-month checkpoints for progress validation
5. **Plan parallel running** — both systems must coexist during transition
6. **Define rollback** — what happens if the new system fails?

### If Brownfield:

1. **Identify highest-value improvements** — what changes have the most impact?
2. **Add observability** — instrument the system before changing it
3. **Add tests** — characterization tests for existing behavior
4. **Choose modernization strategy** — strangler fig, branch by abstraction, etc.
5. **Set boundaries** — what parts of the system will you NOT change?
6. **Define "done"** — what does successful modernization look like?

### If Hybrid:

1. **Draw the boundary** — which components are greenfield, which are brownfield?
2. **Define interfaces** — how do new and old systems communicate?
3. **Sequence the work** — which components get rebuilt first?
4. **Plan for eventual full migration** — or accept permanent hybrid?

## Step 6: Validate the Decision

Before committing, validate with:

- [ ] Proof of concept for highest-risk assumptions
- [ ] Cost estimate reviewed by finance
- [ ] Timeline agreed with stakeholders
- [ ] Team capability assessment complete
- [ ] Risk mitigation plan documented
- [ ] Success metrics defined and measurable
- [ ] Executive sign-off obtained

## Common Decision Pitfalls

| Pitfall | Reality |
|---------|---------|
| "Let's just rewrite it, it'll be easier" | Rewrites almost always take 2-3x longer than estimated |
| "The legacy system is too complex to change" | Usually it's lack of understanding, not impossibility |
| "New tech will solve all our problems" | Technology doesn't fix organizational/process issues |
| "We'll just maintain it forever" | Maintenance costs compound; eventually modernization is forced |
| "We can migrate in 6 months" | Plan for 2-3x your initial estimate |

## The Meta-Decision

If you're still unsure after this framework:

> **Default to brownfield** unless you have overwhelming evidence that greenfield is necessary.

Why? Because:
- Brownfield is lower risk
- Brownfield delivers value faster
- You can always decide to go greenfield later
- Greenfield decisions are harder to reverse
- Most greenfield rewrites fail or take far longer than expected

## Navigation

- [← Modernization Strategies](07-modernization-strategies.md)
- [Glossary →](09-glossary.md)
- [Back to Home](../README.md)
