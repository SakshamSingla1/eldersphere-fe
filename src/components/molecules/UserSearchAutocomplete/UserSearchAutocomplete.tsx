import React, { useMemo, useState } from "react";
import { Autocomplete, CircularProgress, Stack, Typography } from "@mui/material";
import TextField from "../../atoms/TextField/TextField";
import { useDebounce, getErrorMessage } from "../../../utils/helper";
import { useSearchService, type UserLinkSearchResultDTO } from "../../../services/useSearchService";
import type { UserTypeEnum } from "../../../utils/enums";

export interface UserSearchAutocompleteProps {
  /** Restricts results to this account role (ELDER or FAMILY_MEMBER). */
  userType: UserTypeEnum;
  label: string;
  placeholder?: string;
  onSelect: (user: UserLinkSearchResultDTO | null) => void;
  disabled?: boolean;
  helperText?: string;
}

// First use of MUI's Autocomplete in the codebase — a "find one specific existing person"
// lookup for the family-elder link/invite flow (see GET /search/users), debounced the same
// way CrudModule's search box and CaretakerSearch's filters are (see utils/helper.useDebounce).
const UserSearchAutocomplete: React.FC<UserSearchAutocompleteProps> = ({
  userType,
  label,
  placeholder,
  onSelect,
  disabled,
  helperText,
}) => {
  const searchService = useSearchService();
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<UserLinkSearchResultDTO[]>([]);
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
      const results = await searchService.searchUsers(query.trim(), userType);
      setOptions(results);
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
    return "No matching accounts found";
  }, [error, inputValue]);

  return (
    <Autocomplete<UserLinkSearchResultDTO>
      options={options}
      loading={loading}
      filterOptions={(x) => x} // server already filtered — don't re-filter client-side
      getOptionLabel={(option) => option.fullName}
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
              {option.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[option.maskedEmail, option.maskedPhone].filter(Boolean).join(" · ")}
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

export default UserSearchAutocomplete;
