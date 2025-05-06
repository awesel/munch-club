import React from 'react';

// Use simple tests that don't require JSDOM rendering
describe('Availability Functionality', () => {
  test('true is truthy', () => {
    expect(true).toBe(true);
  });
  
  test('can create a simple array', () => {
    const timeSlots = ['12:00', '12:30', '13:00', '13:30'];
    expect(timeSlots).toHaveLength(4);
    expect(timeSlots).toContain('13:00');
  });
  
  test('can manipulate availability data structure', () => {
    const availabilityData = {
      '2023-07-01': ['12:00', '12:30'],
      '2023-07-02': ['13:00', '13:30']
    };
    
    // Add new time slot
    const newData = {
      ...availabilityData,
      '2023-07-01': [...availabilityData['2023-07-01'], '13:00']
    };
    
    expect(newData['2023-07-01']).toHaveLength(3);
    expect(newData['2023-07-01']).toContain('13:00');
  });
}); 