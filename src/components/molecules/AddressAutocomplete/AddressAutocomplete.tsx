import React, { useState } from "react";
import { Autocomplete, CircularProgress } from "@mui/material";
import TextField from "../../atoms/TextField/TextField";
import { useDebounce } from "../../../utils/helper";
import { useGeocodingService, type GeocodingResultDTO } from "../../../services/useGeocodingService";

export interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: React.ReactNode;
}

// Free-text address field backed by free OpenStreetMap Nominatim suggestions (see
// GET /geocoding/search) — `freeSolo` so the user can still type/keep any address that
// doesn't match a suggestion (Nominatim's coverage of e.g. a specific apartment number is
// spotty). Debounced the same way UserSearchAutocomplete is, out of respect for
// Nominatim's ~1 request/second public-instance usage policy.
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ label, value, onChange, required, helperText }) => {
  const geocodingService = useGeocodingService();
  const [options, setOptions] = useState<GeocodingResultDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useDebounce(async (query: string) => {
    if (query.trim().length < 3) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      setOptions(await geocodingService.search(query.trim()));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  return (
    <Autocomplete
      freeSolo
      options={options}
      loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.displayName)}
      inputValue={value}
      onInputChange={(_e, newValue) => {
        onChange(newValue);
        runSearch(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};

export default AddressAutocomplete;
