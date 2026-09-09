import React, { useMemo, useState } from "react";
import { Autocomplete, CircularProgress, Stack, Typography } from "@mui/material";
import TextField from "../../atoms/TextField/TextField";
import StatusChip from "../../atoms/Chip/StatusChip";
import { CARETAKER_VERIFICATION_STATUS_TONE } from "../../atoms/Chip/statusTones";
import { useDebounce, getErrorMessage } from "../../../utils/helper";
import { useSearchService, type CaretakerSearchResultDTO } from "../../../services/useSearchService";

export interface CaretakerSearchAutocompleteProps {
  label: string;
  placeholder?: string;
  onSelect: (caretaker: CaretakerSearchResultDTO | null) => void;
  helperText?: React.ReactNode;
  /** Pre-fills the field as "already assigned to X" (e.g. editing an alert with an existing responder) without triggering a search. */
  initialValue?: { id: number; fullName: string } | null;
}

// Search-by-name/email/phone picker for a caretaker, backed by GET /search/caretakers'
// free-text `query` param (see CaretakerProfileRepository.search) — returns the caretaker
// *profile* id (not a raw user id), which is what fields like
// EmergencyAlert.respondingCaretakerId actually reference. Same debounced-Autocomplete
// pattern as UserSearchAutocomplete, just against a different search endpoint/DTO shape.
const CaretakerSearchAutocomplete: React.FC<CaretakerSearchAutocompleteProps> = ({
  label,
  placeholder,
  onSelect,
  helperText,
  initialValue,
}) => {
  const searchService = useSearchService();
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<CaretakerSearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only `id`/`fullName` are populated for a pre-filled (not-yet-re-searched) value — safe
  // because getOptionLabel only reads `.fullName`, and this placeholder object is never
  // added to `options`, so renderOption (which reads the other fields) never sees it.
  const [selected, setSelected] = useState<CaretakerSearchResultDTO | null>(
    initialValue ? (initialValue as CaretakerSearchResultDTO) : null
  );

  const runSearch = useDebounce(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const page = await searchService.searchCaretakers({ query: query.trim(), page: 0, size: 10 });
      setOptions(page.content);
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
    return "No matching caretakers found";
  }, [error, inputValue]);

  return (
    <Autocomplete<CaretakerSearchResultDTO>
      options={options}
      loading={loading}
      value={selected}
      filterOptions={(x) => x}
      getOptionLabel={(option) => option.fullName}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={noOptionsText}
      onInputChange={(_e, value) => {
        setInputValue(value);
        runSearch(value);
      }}
      onChange={(_e, value) => {
        setSelected(value);
        onSelect(value);
      }}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack direction="row" spacing={1} alignItems="center" width="100%" justifyContent="space-between">
            <Stack>
              <Typography variant="body2" fontWeight={600}>
                {option.fullName}
              </Typography>
              {option.serviceArea && (
                <Typography variant="caption" color="text.secondary">
                  {option.serviceArea}
                </Typography>
              )}
            </Stack>
            <StatusChip label={option.verificationStatus} tone={CARETAKER_VERIFICATION_STATUS_TONE[option.verificationStatus]} />
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

export default CaretakerSearchAutocomplete;
