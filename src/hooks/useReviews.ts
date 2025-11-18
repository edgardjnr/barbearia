import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  client_id: string;
  service_id: string;
  member_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  client_name?: string;
  service_name?: string;
  employee_name?: string;
}

export const useReviews = (filters?: {
  rating?: string;
  search?: string;
}) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["reviews", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("Organization not found");
      }

      let query = supabase
        .from("reviews")
        .select(`
          id,
          client_id,
          service_id,
          member_id,
          rating,
          comment,
          created_at
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      // Apply rating filter
      if (filters?.rating && filters.rating !== "todas") {
        query = query.eq("rating", parseInt(filters.rating));
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Apply search filter in frontend (for simplicity)
      let filteredData = data || [];
      
      // Fetch additional data for each review
      const reviewsWithDetails = await Promise.all(
        filteredData.map(async (review) => {
          // Fetch client name
          const { data: clientData } = await supabase
            .from("clients")
            .select("name")
            .eq("id", review.client_id)
            .single();

          // Fetch service name
          const { data: serviceData } = await supabase
            .from("services")
            .select("name")
            .eq("id", review.service_id)
            .single();

          // Fetch employee name if exists
          let employeeName = null;
          if (review.member_id) {
            const { data: memberData } = await supabase
              .from("organization_members")
              .select(`
                profiles (
                  display_name
                )
              `)
              .eq("id", review.member_id)
              .eq("organization_id", organization.id)
              .single();

            employeeName = memberData?.profiles?.display_name;
          }

          return {
            ...review,
            client_name: clientData?.name,
            service_name: serviceData?.name,
            employee_name: employeeName
          };
        })
      );

      // Apply search filter after getting names
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return reviewsWithDetails.filter(review => 
          review.client_name?.toLowerCase().includes(searchLower) ||
          review.service_name?.toLowerCase().includes(searchLower) ||
          review.comment?.toLowerCase().includes(searchLower)
        );
      }

      return reviewsWithDetails;
    },
    enabled: !!organization?.id,
  });
};

export const useReviewsStats = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["reviews-stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("Organization not found");
      }

      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating, created_at")
        .eq("organization_id", organization.id);

      if (error) {
        throw error;
      }

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? (reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews).toFixed(1)
        : "0.0";

      const satisfactionRate = totalReviews > 0
        ? Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100)
        : 0;

      // Distribution of ratings
      const distribution = Array.from({ length: 5 }, (_, index) => {
        const stars = 5 - index;
        const count = reviews?.filter(r => r.rating === stars).length || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return { stars, count, percentage };
      });

      return {
        totalReviews,
        averageRating,
        satisfactionRate,
        distribution
      };
    },
    enabled: !!organization?.id,
  });
};