import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

const AutoCompleteTextBox = ({ label, options, value, onChange, fullWidth = true}) => {
    return (
        <Autocomplete
            freeSolo
            fullWidth={fullWidth}
            // Ensure options is always an array to prevent crashes
            options={options || []} 
            // This captures both typing AND clicking a suggestion
            onInputChange={(event, newValue) => {
                onChange(newValue);
            }}
            // This ensures the field shows the current state value
            value={value || ''}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label={label} 
                    variant="outlined" 
                />
            )}
        />
    );
};

export default AutoCompleteTextBox;