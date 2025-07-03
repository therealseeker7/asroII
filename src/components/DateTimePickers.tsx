import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, ChevronUp, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

// Simple, reliable date picker
export function ThemedDatePicker({ value, onChange, placeholder = "Select Date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      const date = new Date(value);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };
    }
    const today = new Date();
    return { 
      day: today.getDate(), 
      month: today.getMonth() + 1, 
      year: today.getFullYear() - 25 // Default to 25 years ago
    };
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(selectedDate.month, selectedDate.year) }, (_, i) => i + 1);

  const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
    const newDate = { ...selectedDate, [type]: value };
    
    // Adjust day if it's invalid for the new month/year
    if (type === 'month' || type === 'year') {
      const maxDays = getDaysInMonth(newDate.month, newDate.year);
      if (newDate.day > maxDays) {
        newDate.day = maxDays;
      }
    }
    
    setSelectedDate(newDate);
    
    // Format as YYYY-MM-DD
    const formattedDate = `${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`;
    onChange(formattedDate);
  };

  const formatDisplayDate = () => {
    if (!value) return placeholder;
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const NumberSelector = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string;
    value: number;
    options: (number | string)[];
    onChange: (value: number) => void;
  }) => {
    const [displayValue, setDisplayValue] = useState(value);

    const increment = () => {
      const currentIndex = options.findIndex(opt => 
        typeof opt === 'string' ? months.indexOf(opt) + 1 === value : opt === value
      );
      const nextIndex = (currentIndex + 1) % options.length;
      const nextValue = typeof options[nextIndex] === 'string' 
        ? months.indexOf(options[nextIndex] as string) + 1 
        : options[nextIndex] as number;
      onChange(nextValue);
      setDisplayValue(nextValue);
    };

    const decrement = () => {
      const currentIndex = options.findIndex(opt => 
        typeof opt === 'string' ? months.indexOf(opt) + 1 === value : opt === value
      );
      const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
      const prevValue = typeof options[prevIndex] === 'string' 
        ? months.indexOf(options[prevIndex] as string) + 1 
        : options[prevIndex] as number;
      onChange(prevValue);
      setDisplayValue(prevValue);
    };

    const displayText = typeof options[0] === 'string' 
      ? months[value - 1] 
      : value.toString();

    return (
      <div className="flex flex-col items-center">
        <div className="text-white/60 text-xs mb-2 font-medium">{label}</div>
        <div className="flex flex-col items-center bg-black/20 rounded-lg p-2 min-w-[80px]">
          <button
            onClick={increment}
            className="p-1 text-white/60 hover:text-white transition-colors"
            type="button"
          >
            <ChevronUp size={16} />
          </button>
          <div className="py-2 text-white font-semibold text-center min-h-[24px] flex items-center justify-center">
            {displayText}
          </div>
          <button
            onClick={decrement}
            className="p-1 text-white/60 hover:text-white transition-colors"
            type="button"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 pl-12 text-left text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base hover:bg-black/30"
      >
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        {formatDisplayDate()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Select Date</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex justify-between items-center space-x-4 mb-6">
                <NumberSelector
                  label="Month"
                  value={selectedDate.month}
                  options={months}
                  onChange={(value) => handleDateChange('month', value)}
                />
                
                <NumberSelector
                  label="Day"
                  value={selectedDate.day}
                  options={days}
                  onChange={(value) => handleDateChange('day', value)}
                />
                
                <NumberSelector
                  label="Year"
                  value={selectedDate.year}
                  options={years}
                  onChange={(value) => handleDateChange('year', value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white/10 border border-white/20 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-white/20 active:scale-95"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-purple-500/80 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-purple-500 active:scale-95 shadow-lg"
                  type="button"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple, reliable time picker
export function ThemedTimePicker({ value, onChange, placeholder = "Select Time" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':');
      return {
        hours: parseInt(hours),
        minutes: parseInt(minutes)
      };
    }
    return {
      hours: 12,
      minutes: 0
    };
  });
  const [is24Hour, setIs24Hour] = useState(false);

  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const hours12 = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);
    
    const formattedTime = `${String(newTime.hours).padStart(2, '0')}:${String(newTime.minutes).padStart(2, '0')}`;
    onChange(formattedTime);
  };

  const formatDisplayTime = () => {
    if (!value) return placeholder;
    
    const [hours, minutes] = value.split(':');
    const hour24 = parseInt(hours);
    
    if (is24Hour) {
      return `${hours}:${minutes}`;
    } else {
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
  };

  const TimeSelector = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string;
    value: number;
    options: number[];
    onChange: (value: number) => void;
  }) => {
    const increment = () => {
      const currentIndex = options.indexOf(value);
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex]);
    };

    const decrement = () => {
      const currentIndex = options.indexOf(value);
      const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
      onChange(options[prevIndex]);
    };

    return (
      <div className="flex flex-col items-center">
        <div className="text-white/60 text-xs mb-2 font-medium">{label}</div>
        <div className="flex flex-col items-center bg-black/20 rounded-lg p-2 min-w-[60px]">
          <button
            onClick={increment}
            className="p-1 text-white/60 hover:text-white transition-colors"
            type="button"
          >
            <ChevronUp size={16} />
          </button>
          <div className="py-2 text-white font-semibold text-center font-mono min-h-[24px] flex items-center justify-center">
            {String(value).padStart(2, '0')}
          </div>
          <button
            onClick={decrement}
            className="p-1 text-white/60 hover:text-white transition-colors"
            type="button"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 pl-12 text-left text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-sm sm:text-base hover:bg-black/30"
      >
        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        {formatDisplayTime()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Select Time</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIs24Hour(!is24Hour)}
                    className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/80 hover:bg-white/20 transition-colors border border-white/20"
                    type="button"
                  >
                    {is24Hour ? '24H' : '12H'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    type="button"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex justify-center items-center space-x-8 mb-6">
                <TimeSelector
                  label="Hours"
                  value={is24Hour ? selectedTime.hours : (selectedTime.hours === 0 ? 12 : selectedTime.hours > 12 ? selectedTime.hours - 12 : selectedTime.hours)}
                  options={is24Hour ? hours24 : hours12}
                  onChange={(value) => {
                    const hours24Value = is24Hour ? value : (value === 12 ? 0 : value);
                    handleTimeChange('hours', hours24Value);
                  }}
                />
                
                <div className="text-white text-2xl font-bold self-center mt-8">:</div>
                
                <TimeSelector
                  label="Minutes"
                  value={selectedTime.minutes}
                  options={minutes}
                  onChange={(value) => handleTimeChange('minutes', value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white/10 border border-white/20 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-white/20 active:scale-95"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-purple-500/80 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-purple-500 active:scale-95 shadow-lg"
                  type="button"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}