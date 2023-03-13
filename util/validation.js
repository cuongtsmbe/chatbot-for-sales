module.exports = {
    //validate for user information input
    validateUserInput:function(value) {
        const requiredFields = ["user_name", "phone_number", "address", "password", "status"];
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

    //validate for role type input
    validateRoleInput:function(value){
        const allowedRoleTypes = ["customer", "viewer"];
        if (value.role_type && !allowedRoleTypes.includes(value.role_type)) {
            return "role_type must be one of customer, or viewer";
        }

        return true;
    },

    //validate value of fanpage input
    validateFanpageInput:function(value){
      if (value.status && value.key_fanpage && value.key_open_ai && value.name && value.active != null && value.user_id && value.payment_due_date) {
        // Các giá trị không null, undefined hoặc rỗng
        if (typeof value.active !== 'boolean') {
            // active không phải là kiểu boolean
            return 'active phải là kiểu boolean';
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value.payment_due_date)) {
            // payment_due_date không đúng định dạng ngày tháng năm
            return 'payment_due_date phải đúng định dạng yyyy-mm-dd';
        } else {
            //Các giá trị hợp lệ
            return true;
        }
      } else {
          return 'Các giá trị không được để trống';
      }
    }

      
}