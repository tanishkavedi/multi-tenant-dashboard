const PLANS = {
  free: {
    maxMembers:  2,
    maxApiCalls: 10000,
    label:  'Free'
  },
  pro: {
    maxMembers:  10,
    maxApiCalls: 100000,
    label:  'Pro'
  },
  enterprise: {
    maxMembers:  Infinity,
    maxApiCalls: Infinity,
    label: 'Enterprise'
  }
}

module.exports = PLANS