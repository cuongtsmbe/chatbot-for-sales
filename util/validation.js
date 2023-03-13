module.exports = {
    validateUserInput:function(value) {
        const requiredFields = ["user_name", "phone_number", "address", "password"];
        const allowedRoleTypes = ["customer", "viewer"];
      
        for (const field of requiredFields) {
          if (!value[field] || value[field].trim() === "") {
            return `${field} is required`;
          }
        }
      
        if (value.role_type && !allowedRoleTypes.includes(value.role_type)) {
          return "role_type must be one of customer, or viewer";
        }
      
        return true;
    },
    validateRoleInput:function(value){
        const allowedRoleTypes = ["customer", "viewer"];
        if (value.role_type && !allowedRoleTypes.includes(value.role_type)) {
            return "role_type must be one of customer, or viewer";
        }

        return true;
    }
      

}