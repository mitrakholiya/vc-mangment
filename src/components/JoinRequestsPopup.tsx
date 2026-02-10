import React from "react";
import { Dialog, Typography, List, Button } from "@mui/material";
import toast from "react-hot-toast";

interface JoinRequestsPopupProps {
  open: boolean;
  onClose: () => void;
  requests: any[];
  ventureId: string;
}

import { useManageVentureRequest } from "@/hooks/venture/useVenture";

const JoinRequestsPopup: React.FC<JoinRequestsPopupProps> = ({
  open,
  onClose,
  requests,
  ventureId,
}) => {
  const { mutate: performAction, isPending } = useManageVentureRequest();

  const handleRequestAction = (userId: string, action: "accept" | "reject") => {
    performAction(
      { vc_id: ventureId, user_id: userId, action },
      {
        onSuccess: (result: any) => {
          if (result.success) {
            toast.success(result.message);
            // Reload page to refresh data
            window.location.reload();
          } else {
            toast.error(result.message);
          }
        },
        onError: (error: any) => {
          console.error("Error managing request:", error);
          toast.error("Failed to process request");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      className="m-2 sm:m-0"
    >
      <div className="p-4 sm:p-6 bg-white rounded-lg">
        <Typography
          variant="h6"
          className="mb-4 text-gray-900 font-semibold text-center sm:text-left"
        >
          Join Requests ({requests?.length || 0})
        </Typography>
        <List className="max-h-[60vh] overflow-y-auto">
          {requests && requests.length > 0 ? (
            requests.map((req: any) => (
              <div
                key={req._id || req}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 py-4 gap-3 last:border-0"
              >
                <div className="w-full sm:w-auto">
                  <Typography
                    variant="subtitle2"
                    className="text-gray-900 font-medium text-base"
                  >
                    {req.name || "Unknown User"}
                  </Typography>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <Typography
                      variant="caption"
                      className="text-gray-500 flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                      </svg>
                      {req.email || "No Email"}
                    </Typography>
                    {req.phone && (
                      <Typography
                        variant="caption"
                        className="text-gray-500 flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3 h-3"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {req.phone}
                      </Typography>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button
                    variant="contained"
                    size="small"
                    className="bg-gray-900 text-white hover:bg-gray-800 flex-1 sm:flex-none capitalize"
                    onClick={() =>
                      handleRequestAction(req._id || req, "accept")
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    className="border-red-500 text-red-500 hover:bg-red-50 flex-1 sm:flex-none capitalize"
                    onClick={() =>
                      handleRequestAction(req._id || req, "reject")
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <Typography className="text-center py-8 text-gray-400">
              No pending requests
            </Typography>
          )}
        </List>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-50 capitalize w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default JoinRequestsPopup;
