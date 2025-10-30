/**
 * Realistic Mock Data Samples for SQL Query Execution
 * Provides sample rows for common tables used in Build Flow SQL step
 */

// Import new mock data modules
import { eventsData, sessionsData, pageViewsData } from './mock-data-user-engagement';
import { productViewsData, cartEventsData, supportTicketsData, productRecommendationsData, wishlistItemsData } from './mock-data-product-analytics';
import { dailyMetricsData, hourlyEventsData } from './mock-data-metrics';

export interface MockDataRow {
  [key: string]: any;
}

export interface MockTable {
  name: string;
  schema: string;
  rows: MockDataRow[];
}

// ============================================================================
// Customers Table
// ============================================================================
export const customersData: MockDataRow[] = [
  { customer_id: 1001, email: 'sarah.johnson@example.com', first_name: 'Sarah', last_name: 'Johnson', phone: '555-0123', country: 'US', created_at: '2024-01-15T10:30:00Z', updated_at: '2024-09-20T14:22:00Z', active: true },
  { customer_id: 1002, email: 'michael.chen@example.com', first_name: 'Michael', last_name: 'Chen', phone: '555-0124', country: 'CA', created_at: '2024-02-03T09:15:00Z', updated_at: '2024-09-18T11:45:00Z', active: true },
  { customer_id: 1003, email: 'emma.williams@example.com', first_name: 'Emma', last_name: 'Williams', phone: '555-0125', country: 'UK', created_at: '2024-02-14T14:20:00Z', updated_at: '2024-09-22T16:30:00Z', active: true },
  { customer_id: 1004, email: 'james.rodriguez@example.com', first_name: 'James', last_name: 'Rodriguez', phone: '555-0126', country: 'MX', created_at: '2024-03-10T08:45:00Z', updated_at: '2024-09-15T09:10:00Z', active: false },
  { customer_id: 1005, email: 'olivia.anderson@example.com', first_name: 'Olivia', last_name: 'Anderson', phone: '555-0127', country: 'AU', created_at: '2024-03-22T11:30:00Z', updated_at: '2024-09-25T13:20:00Z', active: true },
  { customer_id: 1006, email: 'liam.brown@example.com', first_name: 'Liam', last_name: 'Brown', phone: '555-0128', country: 'US', created_at: '2024-04-05T15:10:00Z', updated_at: '2024-09-19T10:05:00Z', active: true },
  { customer_id: 1007, email: 'sophia.garcia@example.com', first_name: 'Sophia', last_name: 'Garcia', phone: '555-0129', country: 'ES', created_at: '2024-04-18T12:45:00Z', updated_at: '2024-09-21T14:55:00Z', active: true },
  { customer_id: 1008, email: 'noah.wilson@example.com', first_name: 'Noah', last_name: 'Wilson', phone: '555-0130', country: 'CA', created_at: '2024-05-02T09:30:00Z', updated_at: '2024-09-17T11:25:00Z', active: false },
  { customer_id: 1009, email: 'ava.martinez@example.com', first_name: 'Ava', last_name: 'Martinez', phone: '555-0131', country: 'US', created_at: '2024-05-20T13:15:00Z', updated_at: '2024-09-23T15:40:00Z', active: true },
  { customer_id: 1010, email: 'ethan.taylor@example.com', first_name: 'Ethan', last_name: 'Taylor', phone: '555-0132', country: 'NZ', created_at: '2024-06-01T10:00:00Z', updated_at: '2024-09-24T12:30:00Z', active: true },
  { customer_id: 1011, email: 'isabella.lee@example.com', first_name: 'Isabella', last_name: 'Lee', phone: '555-0133', country: 'SG', created_at: '2024-06-12T14:35:00Z', updated_at: '2024-09-20T09:50:00Z', active: true },
  { customer_id: 1012, email: 'mason.harris@example.com', first_name: 'Mason', last_name: 'Harris', phone: '555-0134', country: 'US', created_at: '2024-06-25T11:20:00Z', updated_at: '2024-09-22T13:15:00Z', active: true },
  { customer_id: 1013, email: 'mia.clark@example.com', first_name: 'Mia', last_name: 'Clark', phone: '555-0135', country: 'UK', created_at: '2024-07-08T08:55:00Z', updated_at: '2024-09-18T16:45:00Z', active: true },
  { customer_id: 1014, email: 'lucas.white@example.com', first_name: 'Lucas', last_name: 'White', phone: '555-0136', country: 'DE', created_at: '2024-07-19T15:40:00Z', updated_at: '2024-09-21T10:20:00Z', active: false },
  { customer_id: 1015, email: 'charlotte.thomas@example.com', first_name: 'Charlotte', last_name: 'Thomas', phone: '555-0137', country: 'FR', created_at: '2024-08-03T12:10:00Z', updated_at: '2024-09-25T14:00:00Z', active: true },
];

// ============================================================================
// Orders Table
// ============================================================================
export const ordersData: MockDataRow[] = [
  { order_id: 5001, customer_id: 1001, order_date: '2024-09-01T10:15:00Z', total_amount: 245.50, status: 'completed', created_at: '2024-09-01T10:15:00Z', updated_at: '2024-09-01T15:30:00Z' },
  { order_id: 5002, customer_id: 1002, order_date: '2024-09-02T14:22:00Z', total_amount: 1150.75, status: 'completed', created_at: '2024-09-02T14:22:00Z', updated_at: '2024-09-02T18:45:00Z' },
  { order_id: 5003, customer_id: 1001, order_date: '2024-09-03T09:30:00Z', total_amount: 89.99, status: 'completed', created_at: '2024-09-03T09:30:00Z', updated_at: '2024-09-03T12:20:00Z' },
  { order_id: 5004, customer_id: 1003, order_date: '2024-09-05T16:45:00Z', total_amount: 2340.00, status: 'pending', created_at: '2024-09-05T16:45:00Z', updated_at: '2024-09-05T16:45:00Z' },
  { order_id: 5005, customer_id: 1005, order_date: '2024-09-06T11:10:00Z', total_amount: 567.25, status: 'completed', created_at: '2024-09-06T11:10:00Z', updated_at: '2024-09-06T14:35:00Z' },
  { order_id: 5006, customer_id: 1002, order_date: '2024-09-07T13:55:00Z', total_amount: 425.80, status: 'completed', created_at: '2024-09-07T13:55:00Z', updated_at: '2024-09-07T17:20:00Z' },
  { order_id: 5007, customer_id: 1006, order_date: '2024-09-08T08:20:00Z', total_amount: 1890.50, status: 'completed', created_at: '2024-09-08T08:20:00Z', updated_at: '2024-09-08T11:45:00Z' },
  { order_id: 5008, customer_id: 1007, order_date: '2024-09-10T15:30:00Z', total_amount: 345.00, status: 'shipped', created_at: '2024-09-10T15:30:00Z', updated_at: '2024-09-11T09:15:00Z' },
  { order_id: 5009, customer_id: 1003, order_date: '2024-09-12T10:05:00Z', total_amount: 678.90, status: 'completed', created_at: '2024-09-12T10:05:00Z', updated_at: '2024-09-12T13:40:00Z' },
  { order_id: 5010, customer_id: 1009, order_date: '2024-09-14T12:45:00Z', total_amount: 156.75, status: 'completed', created_at: '2024-09-14T12:45:00Z', updated_at: '2024-09-14T16:10:00Z' },
  { order_id: 5011, customer_id: 1010, order_date: '2024-09-15T14:20:00Z', total_amount: 2450.00, status: 'processing', created_at: '2024-09-15T14:20:00Z', updated_at: '2024-09-16T10:30:00Z' },
  { order_id: 5012, customer_id: 1001, order_date: '2024-09-16T09:50:00Z', total_amount: 534.25, status: 'completed', created_at: '2024-09-16T09:50:00Z', updated_at: '2024-09-16T14:15:00Z' },
  { order_id: 5013, customer_id: 1011, order_date: '2024-09-18T11:30:00Z', total_amount: 890.50, status: 'completed', created_at: '2024-09-18T11:30:00Z', updated_at: '2024-09-18T15:55:00Z' },
  { order_id: 5014, customer_id: 1012, order_date: '2024-09-19T13:15:00Z', total_amount: 1234.75, status: 'shipped', created_at: '2024-09-19T13:15:00Z', updated_at: '2024-09-20T08:40:00Z' },
  { order_id: 5015, customer_id: 1013, order_date: '2024-09-20T10:40:00Z', total_amount: 467.80, status: 'completed', created_at: '2024-09-20T10:40:00Z', updated_at: '2024-09-20T14:05:00Z' },
  { order_id: 5016, customer_id: 1005, order_date: '2024-09-21T15:25:00Z', total_amount: 789.90, status: 'pending', created_at: '2024-09-21T15:25:00Z', updated_at: '2024-09-21T15:25:00Z' },
  { order_id: 5017, customer_id: 1015, order_date: '2024-09-22T12:10:00Z', total_amount: 3450.00, status: 'processing', created_at: '2024-09-22T12:10:00Z', updated_at: '2024-09-23T09:35:00Z' },
  { order_id: 5018, customer_id: 1002, order_date: '2024-09-23T14:55:00Z', total_amount: 234.50, status: 'completed', created_at: '2024-09-23T14:55:00Z', updated_at: '2024-09-23T18:20:00Z' },
  { order_id: 5019, customer_id: 1006, order_date: '2024-09-24T09:35:00Z', total_amount: 1567.25, status: 'completed', created_at: '2024-09-24T09:35:00Z', updated_at: '2024-09-24T13:00:00Z' },
  { order_id: 5020, customer_id: 1007, order_date: '2024-09-25T11:20:00Z', total_amount: 945.80, status: 'shipped', created_at: '2024-09-25T11:20:00Z', updated_at: '2024-09-26T08:45:00Z' },
];

// ============================================================================
// Order Items Table
// ============================================================================
export const orderItemsData: MockDataRow[] = [
  { order_item_id: 10001, order_id: 5001, product_id: 2001, quantity: 2, unit_price: 89.99, discount: 5.00 },
  { order_item_id: 10002, order_id: 5001, product_id: 2003, quantity: 1, unit_price: 65.52, discount: 0.00 },
  { order_item_id: 10003, order_id: 5002, product_id: 2005, quantity: 3, unit_price: 383.58, discount: 0.00 },
  { order_item_id: 10004, order_id: 5003, product_id: 2002, quantity: 1, unit_price: 89.99, discount: 0.00 },
  { order_item_id: 10005, order_id: 5004, product_id: 2008, quantity: 2, unit_price: 1170.00, discount: 0.00 },
  { order_item_id: 10006, order_id: 5005, product_id: 2001, quantity: 1, unit_price: 89.99, discount: 10.00 },
  { order_item_id: 10007, order_id: 5005, product_id: 2006, quantity: 3, unit_price: 159.09, discount: 0.00 },
  { order_item_id: 10008, order_id: 5006, product_id: 2004, quantity: 2, unit_price: 212.90, discount: 0.00 },
  { order_item_id: 10009, order_id: 5007, product_id: 2007, quantity: 1, unit_price: 1890.50, discount: 0.00 },
  { order_item_id: 10010, order_id: 5008, product_id: 2003, quantity: 5, unit_price: 69.00, discount: 0.00 },
  { order_item_id: 10011, order_id: 5009, product_id: 2002, quantity: 3, unit_price: 226.30, discount: 0.00 },
  { order_item_id: 10012, order_id: 5010, product_id: 2001, quantity: 1, unit_price: 89.99, discount: 0.00 },
  { order_item_id: 10013, order_id: 5010, product_id: 2004, quantity: 1, unit_price: 66.76, discount: 0.00 },
  { order_item_id: 10014, order_id: 5011, product_id: 2008, quantity: 2, unit_price: 1225.00, discount: 0.00 },
  { order_item_id: 10015, order_id: 5012, product_id: 2005, quantity: 1, unit_price: 383.58, discount: 0.00 },
  { order_item_id: 10016, order_id: 5012, product_id: 2001, quantity: 1, unit_price: 89.99, discount: 0.00 },
  { order_item_id: 10017, order_id: 5012, product_id: 2006, quantity: 1, unit_price: 60.68, discount: 0.00 },
  { order_item_id: 10018, order_id: 5013, product_id: 2007, quantity: 1, unit_price: 890.50, discount: 0.00 },
  { order_item_id: 10019, order_id: 5014, product_id: 2002, quantity: 5, unit_price: 246.95, discount: 0.00 },
  { order_item_id: 10020, order_id: 5015, product_id: 2003, quantity: 2, unit_price: 233.90, discount: 0.00 },
];

// ============================================================================
// Products Table
// ============================================================================
export const productsData: MockDataRow[] = [
  { product_id: 2001, name: 'Wireless Keyboard', category: 'Electronics', price: 89.99, stock: 245, supplier_id: 301 },
  { product_id: 2002, name: 'USB-C Cable', category: 'Accessories', price: 24.50, stock: 1520, supplier_id: 302 },
  { product_id: 2003, name: 'Laptop Stand', category: 'Office', price: 65.00, stock: 380, supplier_id: 301 },
  { product_id: 2004, name: 'Bluetooth Mouse', category: 'Electronics', price: 45.75, stock: 567, supplier_id: 303 },
  { product_id: 2005, name: 'Monitor 27"', category: 'Electronics', price: 385.00, stock: 125, supplier_id: 301 },
  { product_id: 2006, name: 'Desk Lamp', category: 'Office', price: 52.25, stock: 290, supplier_id: 302 },
  { product_id: 2007, name: 'Ergonomic Chair', category: 'Furniture', price: 1890.50, stock: 45, supplier_id: 304 },
  { product_id: 2008, name: 'Standing Desk', category: 'Furniture', price: 1245.00, stock: 67, supplier_id: 304 },
];

// ============================================================================
// SATCOM Maritime Tracking (from mock-sources.ts)
// ============================================================================
export const maritimeTrackingData: MockDataRow[] = [
  { record_id: 'a1b2c3d4-1111-2222-3333-444444444444', timestamp: '2024-09-25T10:15:32Z', device_id: 'SAT-MAR-001', device_type: 'Maritime Terminal', vessel_mmsi: '367123456', vessel_name: 'Atlantic Voyager', vessel_type: 'Container Ship', latitude: 40.7128, longitude: -74.0060, speed_knots: 18.5, heading: 285.0, network_type: 'L-band' },
  { record_id: 'b2c3d4e5-2222-3333-4444-555555555555', timestamp: '2024-09-25T10:20:45Z', device_id: 'SAT-MAR-002', device_type: 'Maritime Terminal', vessel_mmsi: '235987654', vessel_name: 'Pacific Explorer', vessel_type: 'Cargo Ship', latitude: 34.0522, longitude: -118.2437, speed_knots: 22.3, heading: 45.0, network_type: 'Ku-band' },
  { record_id: 'c3d4e5f6-3333-4444-5555-666666666666', timestamp: '2024-09-25T10:25:18Z', device_id: 'SAT-MAR-003', device_type: 'Maritime Terminal', vessel_mmsi: '477456789', vessel_name: 'Mediterranean Star', vessel_type: 'Oil Tanker', latitude: 51.5074, longitude: -0.1278, speed_knots: 12.8, heading: 180.0, network_type: 'L-band' },
];

// ============================================================================
// SATCOM Aviation Connectivity
// ============================================================================
export const aviationConnectivityData: MockDataRow[] = [
  { record_id: 'd4e5f6g7-4444-5555-6666-777777777777', timestamp: '2024-09-25T10:30:52Z', device_id: 'SAT-AVI-001', aircraft_id: 'N12345', flight_number: 'AA1234', latitude: 35.6762, longitude: 139.6503, altitude_feet: 38000, speed_knots: 450.5, network_type: 'Ka-band' },
  { record_id: 'e5f6g7h8-5555-6666-7777-888888888888', timestamp: '2024-09-25T10:35:22Z', device_id: 'SAT-AVI-002', aircraft_id: 'N67890', flight_number: 'BA5678', latitude: 48.8566, longitude: 2.3522, altitude_feet: 42000, speed_knots: 478.2, network_type: 'Ku-band' },
];

// ============================================================================
// Table Registry
// ============================================================================
export const mockDataTables: Record<string, MockDataRow[]> = {
  // Original e-commerce tables
  'customers': customersData,
  'orders': ordersData,
  'order_items': orderItemsData,
  'products': productsData,

  // SATCOM tables
  'maritime_tracking': maritimeTrackingData,
  'aviation_connectivity': aviationConnectivityData,

  // User engagement (time-series event data)
  'events': eventsData,
  'sessions': sessionsData,
  'page_views': pageViewsData,

  // Product analytics (complex joins)
  'product_views': productViewsData,
  'cart_events': cartEventsData,
  'support_tickets': supportTicketsData,
  'product_recommendations': productRecommendationsData,
  'wishlist_items': wishlistItemsData,

  // Time-series metrics
  'daily_metrics': dailyMetricsData,
  'hourly_events': hourlyEventsData,
};

/**
 * Get mock data for a table by name
 */
export function getMockTableData(tableName: string): MockDataRow[] | undefined {
  const normalizedName = tableName.toLowerCase().replace(/['"]/g, '').trim();
  return mockDataTables[normalizedName];
}

/**
 * Get all available mock table names
 */
export function getMockTableNames(): string[] {
  return Object.keys(mockDataTables);
}
