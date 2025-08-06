export default function getIssueCategories(type = null, options) {
    const issueCategories = {
        vehicle: [
            'mechanical-problems',
            'cosmetic-damages',
            'tire-issues',
            'electronics-and-instruments',
            'maintenance-alerts',
            'fuel-efficiency-issues'
        ],
        driver: [
            'behavior-concerns',
            'documentation',
            'time-management',
            'communication',
            'training-needs',
            'health-and-safety-violations'
        ],
        route: [
            'inefficient-routes',
            'safety-concerns',
            'blocked-routes',
            'environmental-considerations',
            'unfavorable-weather-conditions'
        ],
        'payload-cargo': [
            'damaged-goods',
            'misplaced-goods',
            'documentation-issues',
            'temperature-sensitive-goods',
            'incorrect-cargo-loading'
        ],
        'software-technical': [
            'bugs',
            'ui-ux-concerns',
            'integration-failures',
            'performance',
            'feature-requests',
            'security-vulnerabilities'
        ],
        operational: [
            'compliance',
            'resource-allocation',
            'cost-overruns',
            'communication',
            'vendor-management-issues'
        ],
        customer: [
            'service-quality',
            'billing-discrepancies',
            'communication-breakdown',
            'feedback-and-suggestions',
            'order-errors'
        ],
        security: [
            'unauthorized-access',
            'data-concerns',
            'physical-security',
            'data-integrity-issues'
        ],
        'environmental-sustainability': [
            'fuel-consumption',
            'carbon-footprint',
            'waste-management',
            'green-initiatives-opportunities'
        ]
    };

    if (type) {
        return issueCategories[type] || [];
    }

    const allIssueCategories = Object.values(issueCategories).flat();
    return allIssueCategories;
}
