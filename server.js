function calculateAttendanceStatus(actionType, scanDate) {
    const hours = scanDate.getHours();
    const minutes = scanDate.getMinutes();
    const totalMinutes = hours * 60 + minutes; // គិតជាទីតាំងនាទីក្នុងមួយថ្ងៃ (0 - 1439)
    const gracePeriod = 15; // អនុគ្រោះ ១៥ នាទី

    // 1. ករណីស្កេន "ចូល" (Check-In)
    if (actionType === 'Check-In') {
        // ប្រសិនបើស្កេនចន្លោះពីព្រលឹម ដល់ម៉ោង 8:00 AM (480 នាទី) -> ចាត់ទុកជា "ចូលវេនព្រឹក" (6:00 AM = 360mn)
        if (totalMinutes <= 480) { 
            const shiftStart = 360; // 6:00 AM
            const lateMinutes = totalMinutes - shiftStart;
            
            if (lateMinutes <= gracePeriod) {
                return { status: 'ទាន់ម៉ោង', shift: 'វេនព្រឹក', lateBy: 0 };
            } else {
                return { status: 'យឺត', shift: 'វេនព្រឹក', lateBy: Math.max(0, lateMinutes) };
            }
        } 
        // ប្រសិនបើស្កេនបន្ទាប់ពីម៉ោង 8:00 AM ឡើងទៅ -> ចាត់ទុកជា "ចូលវេនរសៀល" (10:00 AM = 600mn)
        else {
            const shiftStart = 600; // 10:00 AM
            const lateMinutes = totalMinutes - shiftStart;

            if (lateMinutes <= gracePeriod) {
                return { status: 'ទាន់ម៉ោង', shift: 'វេនរសៀល', lateBy: 0 };
            } else {
                return { status: 'យឺត', shift: 'វេនរសៀល', lateBy: Math.max(0, lateMinutes) };
            }
        }
    } 
    
    // 2. ករណីស្កេន "ចេញ" (Check-Out)
    else {
        // ប្រសិនបើស្កេនចេញមុនម៉ោង 4:00 PM (960 នាទី) -> ចាត់ទុកជា "ចេញវេនព្រឹក" (2:00 PM = 840mn)
        if (totalMinutes <= 960) { 
            const shiftEnd = 840; // 2:00 PM
            if (totalMinutes < shiftEnd) {
                return { status: 'ចេញមុន', shift: 'វេនព្រឹក', earlyBy: shiftEnd - totalMinutes };
            } else {
                return { status: 'ត្រឹមត្រូវ', shift: 'វេនព្រឹក', earlyBy: 0 };
            }
        } 
        // ប្រសិនបើស្កេនចេញចាប់ពីម៉ោង 4:00 PM ឡើងទៅ -> ចាត់ទុកជា "ចេញវេនរសៀល" (6:00 PM = 1080mn)
        else {
            const shiftEnd = 1080; // 6:00 PM
            if (totalMinutes < shiftEnd) {
                return { status: 'ចេញមុន', shift: 'វេនរសៀល', earlyBy: shiftEnd - totalMinutes };
            } else {
                return { status: 'ត្រឹមត្រូវ', shift: 'វេនរសៀល', earlyBy: 0 };
            }
        }
    }
}
