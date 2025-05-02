"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function TambahPeerReview() {
  const router = useRouter();
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [reviewees, setReviewees] = useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");
  const [selectedReviewee, setSelectedReviewee] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const reviewersResponse = await fetch(
          "http://localhost:8080/api/trainee/peer-review-assignment/reviewers",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!reviewersResponse.ok) {
          throw new Error(
            `Error fetching reviewers: ${reviewersResponse.status}`
          );
        }
        const reviewersData = await reviewersResponse.json();
        setReviewers(reviewersData.data || []);

        const revieweesResponse = await fetch(
          "http://localhost:8080/api/trainee/peer-review-assignment/reviewees",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        if (!revieweesResponse.ok) {
          throw new Error(
            `Error fetching reviewees: ${revieweesResponse.status}`
          );
        }
        const revieweesData = await revieweesResponse.json();
        setReviewees(revieweesData.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (storedToken) {
      fetchData();
    } else {
      // For demo purposes if token not available.
      setReviewers([
        "skinny.pete",
        "badger",
        "combo",
        "hank.schrader",
        "steve.gomez",
        "gustavo.fring",
        "saul.goodman",
      ]);
      setReviewees(["jesse.pinkman", "todd.alquist", "andrea.cantillo"]);
      setIsLoading(false);
    }
  }, []);

  // Render a loading state until data is fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span>Loading...</span>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedReviewer) return;
    if (!selectedReviewee) return;
    if (!deadline) return;
    if (!token) return;

    try {
      setIsSubmitting(true);
      const formattedDate = format(deadline, "yyyy-MM-dd");
      const response = await fetch(
        "http://localhost:8080/api/trainee/peer-review-assignment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewerUsername: selectedReviewer,
            revieweeUsername: selectedReviewee,
            endDateFill: formattedDate,
          }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        router.push("/peer-review");
      } else {
        console.error(
          result.message || "Failed to create peer review assignment"
        );
      }
    } catch (err) {
      console.error("Error creating peer review assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <Link
          href="/peer-review"
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Tambah Peer Review
        </h1>
        <div className="w-full max-w-2xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="reviewer" className="block font-medium">
                Reviewer
              </label>
              <Select
                value={selectedReviewer}
                onValueChange={setSelectedReviewer}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map((reviewer) => (
                    <SelectItem key={reviewer} value={reviewer}>
                      {reviewer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="reviewee" className="block font-medium">
                Reviewee
              </label>
              <Select
                value={selectedReviewee}
                onValueChange={setSelectedReviewee}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reviewee" />
                </SelectTrigger>
                <SelectContent>
                  {reviewees.map((reviewee) => (
                    <SelectItem key={reviewee} value={reviewee}>
                      {reviewee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="block font-medium">
                Deadline Peer Review
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <Link href="/peer-review">
              <Button
                type="button"
                variant="outline"
                className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Batal
              </Button>
            </Link>
            <Button
              className="w-40"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Peer Review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
