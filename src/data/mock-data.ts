import { User, Order, Task } from '../services/data.service';

// --- MOCK USERS ---
export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Ravi Kumar', role: 'Admin', password: 'password122' },
  { id: 'user-2', name: 'Sunita Sharma', role: 'Staff', password: 'password123' },
  { id: 'user-3', name: 'Anil Mehta', role: 'Staff', password: 'password123' },
];

// --- MOCK ORDERS ---
export const MOCK_ORDERS: Order[] = [
  { id: 'order-1', orderNo: 101, orderToken: 'SDP-5821', customerName: 'Priya Patel', contactNo: '9876543210', jobDescription: '50 A4 Color Prints, Glossy Paper', jobUrgency: 'Normal', quantity: 50, unitPrice: 10, totalAmount: 500, advanceAmount: 200, status: 'Completed', paymentStatus: 'Paid', assignedToUserId: 'user-2', createdAt: new Date('2024-07-20T10:00:00Z'), completedAt: new Date('2024-07-21T14:00:00Z') },
  { id: 'order-2', orderNo: 102, orderToken: 'SDP-9432', customerName: 'Deepak Singh', contactNo: '9876543211', jobDescription: '5 Hard Cover Book Bindings', jobUrgency: 'High', quantity: 5, unitPrice: 150, totalAmount: 750, advanceAmount: 0, status: 'In Progress', paymentStatus: 'Pending', assignedToUserId: 'user-3', createdAt: new Date('2024-07-21T11:30:00Z') },
  { id: 'order-3', orderNo: 103, orderToken: 'SDP-1123', customerName: 'Corporate Solutions Ltd.', contactNo: '9876543212', jobDescription: '1000 B&W Xerox, 2-sided', jobUrgency: 'Normal', quantity: 1000, unitPrice: 1.5, totalAmount: 1500, advanceAmount: 750, status: 'Pending', paymentStatus: 'Pending', createdAt: new Date('2024-07-22T09:00:00Z') },
  { id: 'order-4', orderNo: 104, orderToken: 'SDP-4891', customerName: 'Aarav Gupta', contactNo: '9876543213', jobDescription: '200 Visiting Cards, Matte Finish', jobUrgency: 'Urgent', quantity: 200, unitPrice: 4, totalAmount: 800, advanceAmount: 800, status: 'Completed', paymentStatus: 'Paid', assignedToUserId: 'user-2', createdAt: new Date('2024-07-22T14:00:00Z'), completedAt: new Date('2024-07-24T18:00:00Z') },
  { id: 'order-5', orderNo: 105, orderToken: 'SDP-7654', customerName: 'Sneha Reddy', contactNo: '9876543214', jobDescription: '10 A3 Laminations', jobUrgency: 'Normal', quantity: 10, unitPrice: 20, totalAmount: 200, advanceAmount: 200, status: 'In Progress', paymentStatus: 'Paid', assignedToUserId: 'user-3', createdAt: new Date('2024-07-23T12:00:00Z') },
  { id: 'order-6', orderNo: 106, orderToken: 'SDP-3344', customerName: 'Priya Patel', contactNo: '9876543210', jobDescription: '20 Wedding Invitations', jobUrgency: 'High', quantity: 20, unitPrice: 50, totalAmount: 1000, advanceAmount: 500, status: 'Pending', paymentStatus: 'Pending', assignedToUserId: 'user-2', createdAt: new Date('2024-07-24T10:00:00Z') },
];

// --- MOCK TASKS (10 entries) ---
export const MOCK_TASKS: Task[] = [
  { id: 'task-1', description: 'Restock A4 paper bundles', assignedToUserId: 'user-2', dueDate: new Date('2024-07-25'), status: 'Open', priority: 'High', createdAt: new Date() },
  { id: 'task-2', description: 'Service the main Xerox machine', dueDate: new Date('2024-07-28'), status: 'Open', priority: 'High', createdAt: new Date() },
  { id: 'task-3', description: 'Follow up with Corporate Solutions Ltd. on payment', assignedToUserId: 'user-1', dueDate: new Date('2024-07-26'), status: 'In Progress', priority: 'Medium', createdAt: new Date() },
  { id: 'task-4', description: 'Organize the front desk inventory', assignedToUserId: 'user-3', dueDate: new Date('2024-07-24'), status: 'Open', priority: 'Low', createdAt: new Date() },
  { id: 'task-5', description: 'Clean the color printer heads', assignedToUserId: 'user-2', dueDate: new Date('2024-07-25'), status: 'Done', priority: 'Medium', createdAt: new Date() },
  { id: 'task-6', description: 'Order new toner cartridges', assignedToUserId: 'user-1', dueDate: new Date('2024-08-01'), status: 'Open', priority: 'High', createdAt: new Date() },
  { id: 'task-7', description: 'Update the price list display board', dueDate: new Date('2024-07-30'), status: 'Open', priority: 'Medium', createdAt: new Date() },
  { id: 'task-8', description: 'Clear old print jobs from computer desktops', assignedToUserId: 'user-3', dueDate: new Date('2024-07-27'), status: 'In Progress', priority: 'Low', createdAt: new Date() },
  { id: 'task-9', description: 'Design promotional flyer for monsoon offer', assignedToUserId: 'user-1', dueDate: new Date('2024-08-05'), status: 'Open', priority: 'Medium', createdAt: new Date() },
  { id: 'task-10', description: 'Call vendor for binding glue supply', assignedToUserId: 'user-2', dueDate: new Date('2024-07-24'), status: 'Open', priority: 'High', createdAt: new Date() },
];
