import React, { useMemo, useState } from "react";
import { Autocomplete, CircularProgress, Stack, Typography } from "@mui/material";
import TextField from "../../atoms/TextField/TextField";
import { useDebounce, formatDate, getErrorMessage } from "../../../utils/helper";
import { useElderProfileService, type ElderProfileResponse } from "../../../services/useElderProfileService";

export interface ElderProfileSearchAutocompleteProps {
  label: string;
  placeholder?: string;
  onSelect: (profile: ElderProfileResponse | null) => void;
  disabled?: boolean;
  helperText?: string;
}

// Admin "find an elder profile by name" picker (see GET /elder-profiles/search) — used in
// place of asking an admin to already know a profile's numeric ID (Admin > Elder Profiles,
// Admin > Medical Records). Mirrors UserSearchAutocomplete's debounced-server-search shape;
// date of birth is shown alongside the name since two elders can share a first/last name.
const ElderProfileSearchAutocomplete: React.FC<ElderProfileSearchAutocompleteProps> = ({
  label,
  placeholder,
  onSelect,
  disabled,
  helperText,
}) => {
  const elderProfileService = useElderProfileService();
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<ElderProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useDebounce(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await elderProfileService.searchByName(query.trim());
      setOptions(result.content);
    } catch (err) {
      setError(getErrorMessage(err, "Search failed"));
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, 400);

  const noOptionsText = useMemo(() => {
    if (error) return error;
    if (inputValue.trim().length < 2) return "Type at least 2 characters to search";
    return "No matching elder profiles found";
  }, [error, inputValue]);

  return (
    <Autocomplete<ElderProfileResponse>
      options={options}
      loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={noOptionsText}
      onInputChange={(_e, value) => {
        setInputValue(value);
        runSearch(value);
      }}
      onChange={(_e, value) => onSelect(value)}
      disabled={disabled}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack>
            <Typography variant="body2" fontWeight={600}>
              {option.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.dateOfBirth ? `Born ${formatDate(option.dateOfBirth)}` : `Profile #${option.id}`}
            </Typography>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
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

export default ElderProfileSearchAutocomplete;
