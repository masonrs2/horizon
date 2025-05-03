package validation

import "regexp"

// IsValidEmail validates email format using a simple regex
func IsValidEmail(email string) bool {
	// Basic email validation using a simple regex
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	match, _ := regexp.MatchString(emailRegex, email)
	return match
}
