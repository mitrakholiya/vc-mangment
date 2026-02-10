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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <div className="p-4">
        <Typography variant="h6" className="mb-4">
          Join Requests ({requests?.length || 0})
        </Typography>
        <List>
          {requests && requests.length > 0 ? (
            requests.map((req: any) => (
              <div
                key={req._id || req}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <Typography variant="subtitle2">
                    {/* {req.name || "Unknown User"} */}
                    {req}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {/* {req.email || req._id || "No Email"} */}
                  </Typography>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() =>
                      handleRequestAction(req._id || req, "accept")
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
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
            <Typography className="text-center py-4 text-muted">
              No pending requests
            </Typography>
          )}
        </List>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};

export default JoinRequestsPopup;
