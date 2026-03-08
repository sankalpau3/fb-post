const calculateFontSize = (nameString) => {
    const baseSize = 2.5; // Your starting rem
    const charLimit = 17;
    const stepSize = 2;
    const reductionAmount = 0.4;

    const nameLength = nameString?.length || 0;

    if (nameLength <= charLimit) return `${baseSize}rem`;

    // Calculate how many "blocks" of 4 characters exist over the limit
    const extraChars = nameLength - charLimit;
    const reductions = Math.floor(extraChars / stepSize);
    
    // Ensure we don't go too small (optional floor of 1.5rem)
    const newSize = Math.max(1.5, baseSize - (reductions * reductionAmount));
    console.log("newSize", newSize)
    return `${newSize}rem`;
};

export default calculateFontSize