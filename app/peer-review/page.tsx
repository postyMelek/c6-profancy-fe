"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown, Filter } from "lucide-react";
import Link from "next/link";

interface PeerReviewAssignment {
  peerReviewAssignmentId: number;
  reviewerUsername: string;
  revieweeUsername: string;
  endDateFill: string;
}

export default function ManajemenPeerReview() {
  const [assignments, setAssignments] = useState<PeerReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get JWT token from localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);

        if (token) {
          const response = await fetch(
            "http://localhost:8080/api/trainee/peer-review-assignment/all",
            {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error fetching peer review assignments: ${response.status}`
            );
          }

          const result = await response.json();
          setAssignments(result.data || []);
        } else {
          // Sample data for demo purposes
          setAssignments([
            {
              peerReviewAssignmentId: 1,
              reviewerUsername: "gustavo.fring",
              revieweeUsername: "jesse.pinkman",
              endDateFill: "2025-03-27T00:00:00.000+00:00",
            },
            {
              peerReviewAssignmentId: 2,
              reviewerUsername: "mike.ehrmantraut",
              revieweeUsername: "todd.alquist",
              endDateFill: "2025-02-20T00:00:00.000+00:00",
            },
            {
              peerReviewAssignmentId: 3,
              reviewerUsername: "saul.goodman",
              revieweeUsername: "andrea.cantillo",
              endDateFill: "2025-04-10T00:00:00.000+00:00",
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching peer review assignments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const isReviewCompleted = (endDateFill: string) => {
    const endDate = new Date(endDateFill);
    const today = new Date();
    return today > endDate;
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.reviewerUsername
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      assignment.revieweeUsername
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Manajemen Peer Review
        </h1>
        {localStorage.getItem("roles") === "Admin" && (
          <Link href="/peer-review/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Peer Review
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 bg-blue-50">
          <ArrowUpDown className="h-5 w-5" />
          Sort By
        </Button>
        <Button variant="outline" className="gap-2 bg-blue-50">
          <Filter className="h-5 w-5" />
          Filter
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="py-4 px-6 text-left">Reviewer</th>
              <th className="py-4 px-6 text-left">Reviewee</th>
              <th className="py-4 px-6 text-left">Deadline Pengisian</th>
              <th className="py-4 px-6 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment) => (
              <tr
                key={assignment.peerReviewAssignmentId}
                className="bg-blue-50 border-b border-white"
              >
                <td className="py-4 px-6">{assignment.reviewerUsername}</td>
                <td className="py-4 px-6">{assignment.revieweeUsername}</td>
                <td className="py-4 px-6">
                  {formatDate(assignment.endDateFill)}
                </td>
                <td className="py-4 px-6">
                  {isReviewCompleted(assignment.endDateFill) ? (
                    <span className="px-4 py-1 rounded-full text-sm bg-red-100 text-red-500">
                      Selesai
                    </span>
                  ) : (
                    <span className="px-4 py-1 rounded-full text-sm bg-green-100 text-green-600">
                      Running
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No peer review assignments found.</p>
        </div>
      )}
    </div>
  );
}
