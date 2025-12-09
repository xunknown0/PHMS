  /**
   * Updates the current date and time display element.
   */
  const updateDateTime = () => {
    const now = new Date();
    // Use 'en-US' or locale-specific setting for consistent AM/PM format
    const options = { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    };
    
    // Format: 'Month Day | HH:MM AM/PM'
    const rawDateTime = now.toLocaleTimeString('en-US', options);
    const datePart = rawDateTime.split(',')[0];
    const timePart = rawDateTime.split(',')[1].trim();
    const dateTime = `${datePart} | ${timePart}`;

    
    // Find the element and update it
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        datetimeElement.textContent = dateTime;
    }
  };
  
  // Update every second (1000ms)
  setInterval(updateDateTime, 1000);
  
  // Call immediately to avoid a 1-second delay on load
  updateDateTime();