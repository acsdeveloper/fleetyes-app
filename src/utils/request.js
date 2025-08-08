/**
 * HTTP utility functions for authentication, file uploads, and expense reports.
 *
 * @export
 * @class HttpRequest
 */
import config from '../config';

// Try both API hosts to see which one works
const apiUrl = config.FLEETBASE_HOST || "https://afp-api.fleetyes.com"; // Primary API URL
const fallbackApiUrl = "https://ontrack-api.agilecyber.com"; // Fallback API URL

export default class HttpRequest {
    /**
     * Test API connectivity
     */
    static async testApiConnection() {
        const testUrls = [apiUrl, fallbackApiUrl];
        
        for (const url of testUrls) {
            try {
                const response = await fetch(`${url}/api/v1/health`, { method: 'GET' });
                if (response.ok) {
                    return url;
                }
            } catch (error) {
                // Silently continue to next URL
            }
        }
        
        return apiUrl; // Return primary as fallback
    }

    /**
     * Sends a verification code to a given email address.
     *
     * @param {string} email - The email address for verification.
     * @returns {Promise<Object|null>} Response data or null on failure.
     */
    static async sendVerificationCode(email) {
        if (!email) {
            return null;
        }

        // Test API connection first
        const workingApiUrl = await HttpRequest.testApiConnection();

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Add API key if available
                ...(config.FLEETBASE_KEY && { "Authorization": `Bearer ${config.FLEETBASE_KEY}` })
            },
            body: JSON.stringify({ email: email }),
        };

        try {
            const response = await fetch(`${workingApiUrl}/api/v1/drivers/login-with-sms`, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                
                // If it's "No driver found", this is expected for unregistered emails
                if (errorText.includes("No driver found")) {
                    return null; // Return null to indicate no driver found
                }
                
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verifies the provided verification code.
     *
     * @param {string} email - Email address used for verification.
     * @param {string} code - Verification code received via email.
     * @returns {Promise<Object|null>} Verified user details or null on failure.
     */
    static async getVerificationCode(email, code) {
        if (!email || !code) {
            return null;
        }

        // Test API connection first
        const workingApiUrl = await HttpRequest.testApiConnection();

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Add API key if available
                ...(config.FLEETBASE_KEY && { "Authorization": `Bearer ${config.FLEETBASE_KEY}` })
            },
            body: JSON.stringify({ email: email, code, for: "driver_login" }),
        };

        try {
            const response = await fetch(`${workingApiUrl}/api/v1/drivers/verify-code`, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            
            return {
                ...res.data,
                user_uuid: res.user_id,
                driver_uuid: res.driver_uuid,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Sends a verification code for account creation.
     *
     * @param {string} email - The email address for verification.
     * @param {Object} attributes - Additional attributes for account creation.
     * @returns {Promise<Object|null>} Response data or null on failure.
     */
    static async sendAccountCreationCode(email, attributes = {}) {
        if (!email) {
            return null;
        }

        // Test API connection first
        const workingApiUrl = await HttpRequest.testApiConnection();

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Add API key if available
                ...(config.FLEETBASE_KEY && { "Authorization": `Bearer ${config.FLEETBASE_KEY}` })
            },
            body: JSON.stringify({ 
                email: email,
                ...attributes,
                for: "driver_creation"
            }),
        };

        try {
            const response = await fetch(`${workingApiUrl}/api/v1/drivers/login-with-sms`, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                
                if (errorText.includes("No driver found")) {
                    return null;
                }
                
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verifies account creation code and creates the account.
     *
     * @param {string} email - Email address used for verification.
     * @param {string} code - Verification code received via email.
     * @param {Object} attributes - Additional attributes for account creation.
     * @returns {Promise<Object|null>} Created user details or null on failure.
     */
    static async verifyAccountCreationCode(email, code, attributes = {}) {
        if (!email || !code) {
            return null;
        }

        // Test API connection first
        const workingApiUrl = await HttpRequest.testApiConnection();

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Add API key if available
                ...(config.FLEETBASE_KEY && { "Authorization": `Bearer ${config.FLEETBASE_KEY}` })
            },
            body: JSON.stringify({ 
                email: email, 
                code, 
                ...attributes,
                for: "driver_creation" 
            }),
        };

        try {
            const response = await fetch(`${workingApiUrl}/api/v1/drivers/verify-code`, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            
            return {
                ...res.data,
                user_uuid: res.user_id,
                driver_uuid: res.driver_uuid,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Fetches the list of expense reports for a driver.
     *
     * @param {Object} driverData - Contains `token`, `user_uuid`, and `page`.
     * @returns {Promise<Array>} List of reports or an empty array on failure.
     */
    static async getReportList(driverData) {
        if (!driverData?.token) {
            return [];
        }

        const url = `${apiUrl}/api/v1/expense-reports?user_uuid=${driverData.user_uuid}&page=${driverData.page}`;
        const requestOptions = {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverData.token}` },
        };

        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const res = await response.json();
            return res?.data?.data || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Uploads a file.
     *
     * @param {Object} file - File object containing URL, name, and type.
     * @param {string} token - Authorization token.
     * @param {string} uid - Unique identifier for the subject.
     * @returns {Promise<Object|null>} Server response or null on failure.
     */
    static async fileUpload(file, token, uid) {
        if (!file || !token) {
            return null;
        }
        let formData = new FormData();
        formData.append("path", config.FILE_PATH);
        formData.append("disk", config.STORAGE_PATH);
        formData.append("bucket", config.BUCKET_NAME);
        formData.append("subject_uuid", uid);
        formData.append("subject_type", "fleet-ops:fuelreports");
        formData.append("type", "fuel-report-files");
        formData.append("file_size", file.size);
        formData.append("file", { uri: file.url, name: file.fileName, type: file.content_type });

        const requestOptions = {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }, // No need for 'Content-Type', FormData handles it
            body: formData,
        };

        try {
            const response = await fetch(`${apiUrl}/v1/files`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    /**
     * Accepts or rejects an order request.
     *
     * @param {string} orderId - The order ID.
     * @param {boolean} value - Approve (true) or Reject (false).
     * @param {string} token - Authorization token.
     * @returns {Promise<Object|null>} Response from server or null on failure.
     */
    static async orderAcceptRejectRequest(orderId, value, token) {
        if (!orderId || !token) {
            return null;
        }

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ is_approved: value }),
        };

        try {
            const response = await fetch(`${apiUrl}/api/v1/orders/${orderId}/start`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    static async createExpenseReport(reportData, token) {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(reportData)
        };

        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports', requestOptions)
                .then(response => response.json()).then(data => {
                    return data;
                });

        }
        catch (error) {
            return;
        }
    }

    static async updateExpenseReport(uuid, reportData, token) {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(reportData)
        };

        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports/' + uuid, requestOptions)
                .then(response => response.json()).then(data => {
                    return data;
                });
        }
        catch (error) {
            return;
        }
    }

    static async deleteExpenseReport(reportId, token) {
        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports/' + reportId, requestOptions)
                .then(response => {
                    response.json()
                        .then(data => {
                        });
                })
        }
        catch (error) {
            return;
        }

    }

    /**
     * Deletes a file.
     *
     * @param {string} fileID - The ID of the file to be deleted.
     * @param {string} token - Authorization token.
     * @returns {Promise<Object|null>} Server response or null on failure.
     */
    static async deleteFile(fileID, token) {
        if (!fileID || !token) {
            return null;
        }

        const requestOptions = {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        };
        try {
            const response = await fetch(`${apiUrl}/int/v1/files/${fileID}`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    static async getNearByParkingLocation(locationData) {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + locationData['token'] },
            body: JSON.stringify({
                "latitude": locationData['latitude'],
                "longitude": locationData['longitude']
                // "latitude": 8.1750,
                // "longitude": 77.4306
            })
        };

        try {
            const response = await fetch(
                apiUrl + '/api/v1/parking-areas', requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            return res;
        } catch (error) {
            return [];
        }
    }
    
    static async driverUpdateActivity(token, orderId, status ) {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                "status": status,
            })
        };

        try {
            const response = await fetch(
                apiUrl + '/api/v1/orders/'+orderId+'/update-activity', requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            return res;
        } catch (error) {
            return [];
        }
    }
        
    static async markUnavailability(leaveRequest, token, dataId) {
        if (!leaveRequest || !token) {
            return null;
        }

        const requestOptions = {
            method: dataId != "" ? "PUT" : "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(leaveRequest),
        };
        const url = dataId != "" ? `${apiUrl}/api/v1/leave-requests/${dataId}` : `${apiUrl}/api/v1/leave-requests/create`
        try {
            const response = await fetch(url, requestOptions);
            // if (!response.ok)
            //     throw new Error(response);
            return await response.json();
        } catch (error) {
            return error;
        }
    }

    static async getLeaveList(driverData) {
        if (!driverData?.token) {
            return [];
        }
        const url = `${apiUrl}/api/v1/leave-requests/list?user_uuid=${driverData.user_uuid}`;
        const requestOptions = {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverData.token}` },
        };

        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const res = await response.json();
            return res?.data || [];
        } catch (error) {
            return [];
        }
    }

    static async deleteLeave(leaveId, token) {
        try {
            return await fetch(
                apiUrl + '/api/v1/leave-requests/' + leaveId, requestOptions)
                .then(response => {
                    response.json()
                        .then(data => {
                        });
                })
        }
        catch (error) {
            return;
        }

    }
}

// Export individual functions for backward compatibility
const sendCode = HttpRequest.sendVerificationCode;
const getVerificationCode = HttpRequest.getVerificationCode;
const sendAccountCreationCode = HttpRequest.sendAccountCreationCode;
const verifyAccountCreationCode = HttpRequest.verifyAccountCreationCode;

export {
    getVerificationCode,
    sendAccountCreationCode, sendCode, verifyAccountCreationCode
};

