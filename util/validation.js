module.exports = {
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
      if (value.key_fanpage && value.key_open_ai && value.name && value.active && value.user_id && value.payment_due_date) {
        // Các giá trị không null, undefined hoặc rỗng
        if (String(value.active).toLowerCase() != "true" && String(value.active).toLowerCase() != "false") {
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
    },

    //check value have format datetime in mysql
    isValidMySQLDatetime:function(datetimeString) {
        const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        //return boolean
        return datetimeRegex.test(datetimeString);
    },

    //validate type get conversation
    validateTypeConversation: function(value){
        const allowedTypes = ["current", "after","before"];
        if (value && !allowedTypes.includes(value)) {
            return "TypeCursor must be one of current,after or before.";
        }
        return true;
    }
      
}