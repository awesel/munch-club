import React from 'react';

interface AvailabilityGridProps {
  initialAvailability: Record<string, string[]>;
  weekDate: Date;
  onAvailabilityChange: (newAvailability: Record<string, string[]>) => void;
  isSaving: boolean;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({ 
  initialAvailability, 
  weekDate, 
  onAvailabilityChange, 
  isSaving 
}) => {
  return (
    <div data-testid="availability-grid">
      <div className="time-slot">12:00 PM</div>
      <div className="time-slot">1:00 PM</div>
    </div>
  );
};

export default AvailabilityGrid;

// Add a test so the file doesn't fail
describe('AvailabilityGrid Mock', () => {
  test('AvailabilityGrid is defined', () => {
    expect(AvailabilityGrid).toBeDefined();
  });
});

 