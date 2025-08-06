const IssueType = {
    vehicle: 'Vehicle',
    driver: 'Driver',
    route: 'Route',
    'payload-cargo': 'Payload Cargo',
    'software-technical': 'Software Technical',
    operational: 'Operational',
    customer: 'Customer',
    security: 'Security',
    'environmental-sustainability': 'Environmental Sustainability',
};
const IssueCategory = {
    Compliance: 'Compliance',
    ResourceAllocation: 'Resource Allocation',
    CostOverruns: 'Cost Overruns',
    Communication: 'Communication',
    VendorManagementIssue: 'Vendor Management Issue',
};

const IssuePriority = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    'scheduled-maintenance': 'Scheduled Maintenance',
    'operational-suggestion': 'Operational Suggestion',
};

const Status = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    backlogged: 'Backlogged',
    'requires-update': 'Requires Update',
    'in-review': 'In Review',
    're-opened': 'Re Opened',
    duplicate: 'Duplicate',
    'pending-review': 'Pending Review',
    escalated: 'Escalated',
    completed: 'Completed',
    canceled: 'Canceled',
};

const ReportType = {
    fuel: 'Fuel',
    toll: 'Toll',
    parking: 'Parking',
};

const PaymentMethod = {
    Card: 'Card',
    Other: 'Other',
};

const ImageUpload = {
    Camera: 'Camera',
    Gallery: 'Gallery',
};

const LeaveType = {
    Sick: 'Sick',
    Vacation: 'Vacation',
    Other: 'Other',
};


const volumeUnits = [ 
    { label: 'Gallon (US)', units :'gal'},
    { label: 'Liter', units :'L'},
    { label: 'Milliliter', units :'mL' },
    { label: 'Deciliter', units :'dL' },
    { label: 'Decimeter', units :'dm' },
    { label: 'Pint (US)', units :'pt' },
    { label: 'Quart (US)', units :'qt' },
    { label: 'Kilogram', units :'kg' },
];

export { IssuePriority, IssueType, IssueCategory, Status, ReportType, PaymentMethod, volumeUnits, LeaveType };
