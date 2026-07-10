import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { useListAvailability, useSetAvailability } from '../hooks/queries/useExperienceInvites';
import { Calendar, Check, X } from 'phosphor-react-native';

interface ProfessionalAvailabilityCalendarProps {
  experienceId: number;
  isHost?: boolean;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export const ProfessionalAvailabilityCalendar: React.FC<ProfessionalAvailabilityCalendarProps> = ({
  experienceId,
  isHost = false,
  onDateSelect,
  selectedDate,
}) => {
  const { data: availability = [], isLoading, refetch } = useListAvailability(experienceId);
  const setAvailability = useSetAvailability();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayPress = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isHost) {
      setSelectedDates(prev => 
        prev.includes(dateString) 
          ? prev.filter(d => d !== dateString)
          : [...prev, dateString]
      );
    } else {
      onDateSelect?.(dateString);
    }
  };

  const getDayStyle = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const marked = availability.find((item: any) => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === dateString;
    });
    const isSelected = selectedDate === dateString || selectedDates.includes(dateString);
    const isToday = dateString === new Date().toISOString().split('T')[0];
    
    let dayStyle = [styles.day];
    
    if (isToday) {
      dayStyle.push(styles.todayDay);
    }
    
    if (isSelected) {
      dayStyle.push(styles.selectedDay);
    }
    
    if (marked?.status === 'blocked') {
      dayStyle.push(styles.blockedDay);
    }
    
    return dayStyle;
  };

  const getDayTextStyle = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = selectedDate === dateString || selectedDates.includes(dateString);
    const isToday = dateString === new Date().toISOString().split('T')[0];
    const marked = availability.find((item: any) => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === dateString;
    });
    
    let textStyle = [styles.dayText];
    
    if (isToday) {
      textStyle.push(styles.todayText);
    }
    
    if (isSelected) {
      textStyle.push(styles.selectedDayText);
    }
    
    if (marked?.status === 'blocked') {
      textStyle.push(styles.blockedText);
    }
    
    return textStyle;
  };

  const hasAvailability = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availability.some((item: any) => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === dateString;
    });
  };

  const getAvailabilityStatus = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const marked = availability.find((item: any) => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === dateString;
    });
    return marked?.status;
  };

  const handleSetAvailability = useCallback((status: 'available' | 'blocked') => {
    if (selectedDates.length === 0) return;
    
    setAvailability.mutate({
      experienceId,
      dates: selectedDates,
      status,
    }, {
      onSuccess: () => {
        setSelectedDates([]);
        refetch();
        Alert.alert('Success', `Dates marked as ${status}`);
      },
      onError: (error) => {
        Alert.alert('Error', 'Failed to update availability. Please try again.');
        console.error('Availability update error:', error);
      },
    });
  }, [selectedDates, experienceId, setAvailability, refetch]);

  const clearSelection = () => {
    setSelectedDates([]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Availability Calendar</Text>
        {isHost && (
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
            <Calendar size={20} color="#FF385C" weight="duotone" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {monthNames[currentMonthIndex]} {currentYear}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map(dayName => (
          <Text key={dayName} style={styles.dayName}>
            {dayName}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <View key={index} style={styles.dayContainer}>
            {day ? (
              <TouchableOpacity
                style={getDayStyle(day)}
                onPress={() => handleDayPress(day)}
                disabled={!isHost && getAvailabilityStatus(day) === 'blocked'}
              >
                <Text style={getDayTextStyle(day)}>{day}</Text>
                {hasAvailability(day) && (
                  <View style={styles.statusIndicator}>
                    {getAvailabilityStatus(day) === 'available' ? (
                      <Check size={12} color="#00A699" weight="bold" />
                    ) : (
                      <X size={12} color="#FF5A5F" weight="bold" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyDay} />
            )}
          </View>
        ))}
      </View>
      
      {isHost && (
        <View style={styles.hostControls}>
          {selectedDates.length > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectedCount}>
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.availableButton, (selectedDates.length === 0 || setAvailability.isLoading) && styles.disabledButton]}
              onPress={() => handleSetAvailability('available')}
              disabled={selectedDates.length === 0 || setAvailability.isLoading}
            >
              <Check size={16} color="#ffffff" weight="bold" />
              <Text style={[styles.availableButtonText, (selectedDates.length === 0 || setAvailability.isLoading) && styles.disabledButtonText]}>
                {setAvailability.isLoading ? 'Updating...' : 'Mark Available'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.blockedButton, (selectedDates.length === 0 || setAvailability.isLoading) && styles.disabledButton]}
              onPress={() => handleSetAvailability('blocked')}
              disabled={selectedDates.length === 0 || setAvailability.isLoading}
            >
              <X size={16} color="#ffffff" weight="bold" />
              <Text style={[styles.blockedButtonText, (selectedDates.length === 0 || setAvailability.isLoading) && styles.disabledButtonText]}>
                {setAvailability.isLoading ? 'Updating...' : 'Block Dates'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Check size={16} color="#00A699" weight="bold" />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <X size={16} color="#FF5A5F" weight="bold" />
          <Text style={styles.legendText}>Blocked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF385C' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#717171',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#717171',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F7F7F7',
  },
  emptyDay: {
    width: 40,
    height: 40,
  },
  todayDay: {
    backgroundColor: '#FF385C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#FF385C',
    borderWidth: 2,
    borderColor: '#FF385C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blockedDay: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF5A5F',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: '#222222',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '700' as any,
    fontSize: 16,
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '700' as any,
    fontSize: 16,
  },
  blockedText: {
    color: '#FF5A5F',
    fontWeight: '600' as any,
    fontSize: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  hostControls: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedCount: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F7F7F7',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#717171',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  availableButton: {
    backgroundColor: '#00A699',
  },
  blockedButton: {
    backgroundColor: '#FF5A5F',
  },
  availableButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  blockedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#717171',
    fontWeight: '500',
  },
});
