package constants

// Role names - match database roles table
const (
	RoleStudent     = "student"
	RoleTA          = "ta"
	RoleInstructor  = "instructor"
	RoleAdmin       = "admin"
	RoleJudgeWorker = "judge_worker"
)

// RoleGroups define common role combinations
var (
	// AllUserRoles includes all roles that represent users (not system roles)
	AllUserRoles = []string{RoleStudent, RoleTA, RoleInstructor, RoleAdmin}

	// StudentRoles includes roles that can access student features
	StudentRoles = []string{RoleStudent, RoleTA, RoleInstructor, RoleAdmin}

	// InstructorRoles includes roles that can create/manage content
	InstructorRoles = []string{RoleTA, RoleInstructor, RoleAdmin}

	// AdminRoles includes roles with administrative privileges
	AdminRoles = []string{RoleAdmin}

	// PrivilegedRoles includes roles that can see private content
	PrivilegedRoles = []string{RoleInstructor, RoleAdmin}
)

// HasRole checks if a role slice contains any of the specified roles
func HasRole(userRoles []string, allowedRoles ...string) bool {
	for _, userRole := range userRoles {
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				return true
			}
		}
	}
	return false
}

// HasAnyRole checks if user has any of the roles in the allowed list
func HasAnyRole(userRoles []string, allowedRoles []string) bool {
	return HasRole(userRoles, allowedRoles...)
}
