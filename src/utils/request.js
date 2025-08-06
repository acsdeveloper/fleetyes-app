/**
 * HTTP utility functions for authentication, file uploads, and expense reports.
*
 * @export
 * @class HttpRequest
 */
import config from 'config';
const apiUrl = config.FLEETBASE_HOST || "https://afp-api.fleetyes.com"; // Use env variable

export default class HttpRequest {
    /**
     * Sends a verification code to a given mobile number.
     *
     * @param {string} mobile - The mobile number for verification.
     * @returns {Promise<Object|null>} Response data or null on failure.
     */
    static async sendVerificationCode(email) {
        if (!email) {
            console.error("Error: Email is required.");
            return null;
        }

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email }),
        };

        try {
            const response = await fetch(`${apiUrl}/api/v1/drivers/login-with-sms`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error sending verification code:", error);
            return null;
        }
    }

    /**
     * Verifies the provided verification code.
     *
     * @param {string} mobile - Mobile number used for verification.
     * @param {string} code - Verification code received via SMS.
     * @returns {Promise<Object|null>} Verified user details or null on failure.
     */
    static async getVerificationCode(email, code) {
        if (!email || !code) {
            console.error("Error: Email and code are required.");
            return null;
        }

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, code, for: "driver_login" }),
        };

        try {
            const response = await fetch(`${apiUrl}/api/v1/drivers/verify-code`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const res = await response.json();
            return {
                ...res.data,
                user_uuid: res.user_id,
                driver_uuid: res.driver_uuid,
            };
        } catch (error) {
            console.error("Error verifying code:", error);
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
            console.error("Error: Authorization token is missing.");
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
            console.error("Error fetching report list:", error);
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
            console.error("Error: File and authorization token are required.");
            return null;
        }
        console.log("Uploading file", file.size);
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

        console.log(apiUrl + "/v1/files");
        console.log(requestOptions);

        try {
            const response = await fetch(`${apiUrl}/v1/files`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error uploading file:", error);
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
            console.error("Error: Invalid parameters for order approval/rejection.");
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
            console.error("Error processing order:", error);
            return null;
        }
    }

    static async createExpenseReport(reportData, token) {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(reportData)
        };

        console.log('requestOptions', requestOptions);
        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports', requestOptions)
                .then(response => response.json()).then(data => {
                    console.log("create", data);
                    return data;
                });

        }
        catch (error) {
            console.error("error");
            console.error(error);
            return;
        }
    }

    static async updateExpenseReport(uuid, reportData, token) {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(reportData)
        };

        console.log('requestOptions', requestOptions);
        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports/' + uuid, requestOptions)
                .then(response => response.json()).then(data => {
                    console.log("update", data);
                    return data;
                });
        }
        catch (error) {
            console.error("error");
            console.error(error);
            return;
        }
    }

    static async deleteExpenseReport(reportId, token) {
        console.log('deleteExpenseReport')
        const requestOptions = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        };

        console.log('requestOptions', requestOptions);
        try {
            return await fetch(
                apiUrl + '/api/v1/expense-reports/' + reportId, requestOptions)
                .then(response => {
                    response.json()
                        .then(data => {
                            console.log(data);
                        });
                })
        }
        catch (error) {
            console.error("error");
            console.error(error);
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
            console.error("Error: File ID and authorization token are required.");
            return null;
        }

        const requestOptions = {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        };
        console.log("fileID: ", fileID);
        console.log("requestOptions: ", requestOptions);
        try {
            const response = await fetch(`${apiUrl}/int/v1/files/${fileID}`, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error deleting file:", error);
            return null;
        }
    }

    static async getNearByParkingLocation(locationData) {
        console.log('Getting location');
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

        console.log('requestOptions', requestOptions);
        try {
            const response = await fetch(
                apiUrl + '/api/v1/parking-areas', requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            console.log("res", res);
            return res;
        } catch (error) {
            console.error("Error fetching parking location list:", error);
            return [];
        }
    }
    
    static async driverUpdateActivity(token, orderId, status ) {
        console.log('Update Activity');
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                "status": status,
            })
        };

        console.log('requestOptions', requestOptions);
        try {
            const response = await fetch(
                apiUrl + '/api/v1/orders/'+orderId+'/update-activity', requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const res = await response.json();
            console.log("res", res);
            return res;
        } catch (error) {
            console.error("Error updating driver activity", error);
            return [];
        }
    }
        
    static async markUnavailability(leaveRequest, token, dataId) {
        if (!leaveRequest || !token) {
            console.error("Error: Invalid parameters for leave approval/rejection.");
            return null;
        }

        const requestOptions = {
            method: dataId != "" ? "PUT" : "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(leaveRequest),
        };
        const url = dataId != "" ? `${apiUrl}/api/v1/leave-requests/${dataId}` : `${apiUrl}/api/v1/leave-requests/create`
        console.log('requestOptions', requestOptions);
        console.log('url', url);
        try {
            const response = await fetch(url, requestOptions);
            // if (!response.ok)
            //     throw new Error(response);
            return await response.json();
        } catch (error) {
            console.log('response', JSON.stringify(error));
            return error;
        }
    }

    static async getLeaveList(driverData) {
        if (!driverData?.token) {
            console.error("Error: Authorization token is missing.");
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
            console.log(res);
            return res?.data || [];
        } catch (error) {
            console.error("Error fetching report list:", error);
            return [];
        }
    }

    static async deleteLeave(leaveId, token) {
        console.log('deleteLeave')
        const requestOptions = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        };

        console.log('requestOptions', requestOptions);
        try {
            return await fetch(
                apiUrl + '/api/v1/leave-requests/' + leaveId, requestOptions)
                .then(response => {
                    response.json()
                        .then(data => {
                            console.log(data);
                        });
                })
        }
        catch (error) {
            console.error("error");
            console.error(error);
            return;
        }

    }
}


const orderAcceptRejectRequest = HttpRequest.orderAcceptRejectRequest;
const getNearByParkingLocation = HttpRequest.getNearByParkingLocation;

const fetchReports = HttpRequest.getReportList;
const sendCode = HttpRequest.sendVerificationCode;
const getVerificationCode = HttpRequest.getVerificationCode;
const createExpenseReport = HttpRequest.createExpenseReport;
const updateExpenseReport = HttpRequest.updateExpenseReport;
const deleteExpenseReport = HttpRequest.deleteExpenseReport;
const fileUploadAPI = HttpRequest.fileUpload;
const deleteFile = HttpRequest.deleteFile;
const markUnavailability = HttpRequest.markUnavailability;
const getLeaveList = HttpRequest.getLeaveList;
const deleteLeaveRequest = HttpRequest.deleteLeave;
const driverUpdateActivity = HttpRequest.driverUpdateActivity;
export { orderAcceptRejectRequest, getNearByParkingLocation, fetchReports, getVerificationCode, createExpenseReport, updateExpenseReport, deleteExpenseReport, fileUploadAPI, deleteFile, sendCode, markUnavailability, driverUpdateActivity, getLeaveList, deleteLeaveRequest };