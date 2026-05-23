# Greenfield vs Brownfield: Side-by-Side Comparison

## Comprehensive Comparison Table

| Dimension | Greenfield | Brownfield |
|-----------|-----------|------------|
| **Starting Point** | Nothing — blank slate | Existing system in production |
| **Architecture** | Design from scratch | Constrained by existing design |
| **Technology** | Free choice | Limited by existing stack |
| **Risk Profile** | High upfront, decreases over time | Low upfront, accumulates over time |
| **Cost Pattern** | High initial investment | Ongoing incremental costs |
| **Time to Market** | Longer for first release | Faster for incremental changes |
| **Team Skills** | Modern tech expertise | Legacy + domain expertise |
| **Testing** | Built-in from start | Often retrofitted |
| **Documentation** | Created fresh | Often outdated or missing |
| **User Impact** | No existing users affected | Must maintain service for users |
| **Data** | Start fresh | Must handle existing data |
| **Compliance** | Design for current regulations | Must maintain regulatory history |

## Risk Comparison

### Greenfield Risks
```
Time →
Risk ▲
     │ ████
     │ ████████
     │ ████████████
     │ ████████████████
     │ ████████████████████
     │ ████████████████████████
     │ ████████████████████████████░░░░░░░░
     │ ████████████████████████████░░░░░░░░░░░░
     └────────────────────────────────────────────→
     Start                                    Mature

     ████ = Requirement/Market Risk
     ░░░░ = Technical Risk (decreases as system stabilizes)
```

### Brownfield Risks
```
Time →
Risk ▲
     │                              ░░░░░░░░░░░░░░
     │                         ░░░░░░░░░░░░░░░░░░
     │                    ░░░░░░░░░░░░░░░░░░░░░░
     │               ░░░░░░░░░░░░░░░░░░░░░░░░░
     │          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░
     │     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
     │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
     │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░
     └────────────────────────────────────────────→
     Start                                    Mature

     ░░░░ = Technical Debt Risk (accumulates over time)
```

## Cost Comparison

### Greenfield Cost Curve
- **Year 1**: Very high (building everything from scratch)
- **Year 2-3**: Moderate (stabilizing and growing)
- **Year 4+**: Lower (system is mature, incremental costs)

### Brownfield Cost Curve
- **Year 1**: Low to moderate (small changes to existing system)
- **Year 2-3**: Moderate (increasing complexity)
- **Year 4+**: Can spike (technical debt reaches critical mass)

## Decision Matrix

Use this matrix to help decide which approach fits your situation:

| Factor | Favors Greenfield (Score: +1) | Favors Brownfield (Score: -1) |
|--------|-------------------------------|-------------------------------|
| **Existing system quality** | Beyond repair, fundamentally flawed | Working, maintainable |
| **Business requirements** | Completely new requirements | Incremental changes needed |
| **Budget** | Large upfront budget available | Limited budget, ongoing funding |
| **Timeline** | Can wait 12-18+ months | Need results in weeks/months |
| **Team** | Experienced with modern tech | Deep legacy domain knowledge |
| **Users** | No existing users | Active user base |
| **Data** | No critical data to migrate | Years of critical data |
| **Compliance** | Can design for current rules | Must maintain audit trail |
| **Risk tolerance** | High (can afford failure) | Low (must maintain stability) |

**Scoring**:
- Score ≥ 5: Strong case for greenfield
- Score 2-4: Consider greenfield with careful planning
- Score -1 to 1: Hybrid approach (brownfield with greenfield components)
- Score ≤ -2: Brownfield is likely the better choice

## The Hybrid Approach

In practice, many organizations use a **hybrid** strategy:

```
┌───────────────────────────────────────────────────┐
│                 HYBRID APPROACH                     │
│                                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│  │ Existing │     │   New    │     │ Existing │  │
│  │ System A │────▶│ Service  │◀────│ System B │  │
│  │(Brownfield)│   │(Greenfield)│   │(Brownfield)│ │
│  └──────────┘     └──────────┘     └──────────┘  │
│                                                    │
│  Keep what works + Build new where needed          │
└───────────────────────────────────────────────────┘
```

## Navigation

- [← Brownfield Development](03-brownfield.md)
- [Why It's Trending →](05-why-trending.md)
- [Back to Home](../README.md)
