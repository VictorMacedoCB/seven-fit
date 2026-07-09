import { supabase } from "./supabase";

/**
 * Uploads a base64 progress photo to Supabase storage under a user-specific folder.
 * Returns the public URL of the uploaded image.
 */
export async function uploadBase64Photo(userId, base64, fileName) {
  if (!supabase) throw new Error("Supabase not configured");

  try {
    // Extract mimetype and decode base64
    const mimeMatch = base64.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const res = await fetch(base64);
    const blob = await res.blob();

    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from("progress-photos")
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("progress-photos")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Error uploading base64 photo:", err);
    throw err;
  }
}

/**
 * Fetches all Seven-Fit related data from Supabase for a given user.
 * Returns null if the user has no profile/records yet.
 */
export async function fetchUserData(userId) {
  if (!supabase) return null;

  try {
    // Todas as queries abaixo são independentes entre si (nenhuma usa o resultado da outra),
    // então rodam em paralelo com Promise.all em vez de uma esperar a outra terminar. Antes,
    // eram 9 chamadas sequenciais — numa conexão mais lenta ou com latência mais alta, a soma
    // de todas facilmente passava do tempo limite de segurança, o que abortava a sincronização
    // e fazia o app parecer "voltar pros dados padrão" mesmo com tudo certo no banco.
    const [
      profileRes,
      foodLogsRes,
      workoutLogsRes,
      weightLogsRes,
      customFoodsRes,
      customExercisesRes,
      scheduleRes,
      workoutPlansRes,
      progressPhotosRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("food_logs").select("*").eq("user_id", userId),
      supabase.from("workout_logs").select("*").eq("user_id", userId),
      supabase.from("weight_logs").select("*").eq("user_id", userId).order("date", { ascending: true }),
      supabase.from("custom_foods").select("*").eq("user_id", userId),
      supabase.from("custom_exercises").select("*").eq("user_id", userId),
      supabase.from("schedule").select("*").eq("user_id", userId),
      // Isolado com .catch próprio: se a tabela workout_plans ainda não existir (migration V3
      // não aplicada) ou der qualquer outro erro, isso não pode derrubar todo o Promise.all e
      // levar junto os outros 8 resultados que estavam corretos. Importante: o query builder do
      // Supabase não é uma Promise "de verdade" (não tem .catch próprio, só .then), por isso
      // precisa passar por Promise.resolve(...) antes de encadear o .catch.
      Promise.resolve(
        supabase.from("workout_plans").select("*").eq("user_id", userId).single()
      ).catch((err) => ({ data: null, error: err })),
      supabase.from("progress_photos").select("*").eq("user_id", userId),
    ]);

    const { data: profileData, error: profileError } = profileRes;
    // PGRST116 means zero rows returned (not found)
    if (profileError && profileError.code === "PGRST116") return null;
    if (profileError) throw profileError;

    const { data: foodLogs, error: foodError } = foodLogsRes;
    if (foodError) throw foodError;

    const { data: workoutLogs, error: workoutError } = workoutLogsRes;
    if (workoutError) throw workoutError;

    const { data: weightLogs, error: weightError } = weightLogsRes;
    if (weightError) throw weightError;

    const { data: customFoods, error: foodCustomError } = customFoodsRes;
    if (foodCustomError) throw foodCustomError;

    const { data: customExercises, error: exCustomError } = customExercisesRes;
    if (exCustomError) throw exCustomError;

    const { data: schedule, error: schedError } = scheduleRes;
    if (schedError) throw schedError;

    // Fetch workout plans (exercícios salvos por divisão/grupo, ex: Upper, Lower, Push...).
    // PGRST116 = zero rows (usuário ainda não tem plano salvo na nuvem) — não é erro real.
    let workoutPlansRow = null;
    if (workoutPlansRes.error && workoutPlansRes.error.code !== "PGRST116") {
      console.error("Failed to fetch workout_plans (a tabela existe? rode a migration V3):", workoutPlansRes.error);
    } else {
      workoutPlansRow = workoutPlansRes.data;
    }

    const { data: progressPhotos, error: photoError } = progressPhotosRes;
    if (photoError) throw photoError;

    // Format schedule
    let formattedSchedule = null;
    if (schedule && schedule.length === 7) {
      const dayOrder = { "Seg": 0, "Ter": 1, "Qua": 2, "Qui": 3, "Sex": 4, "Sab": 5, "Dom": 6 };
      formattedSchedule = [...schedule].sort((a, b) => dayOrder[a.day] - dayOrder[b.day]).map(item => ({
        day: item.day,
        type: item.type,
        color: item.color,
        calType: item.cal_type,
        group: item.group_name
      }));
    }

    // Format custom exercises
    const formattedCustomExercises = {};
    if (customExercises) {
      customExercises.forEach(row => {
        if (!formattedCustomExercises[row.group]) {
          formattedCustomExercises[row.group] = [];
        }
        if (!formattedCustomExercises[row.group].includes(row.name)) {
          formattedCustomExercises[row.group].push(row.name);
        }
      });
    }

    // Map profile
    const formattedProfile = {
      weight: Number(profileData.weight),
      height: Number(profileData.height),
      age: Number(profileData.age),
      current_bf: Number(profileData.current_bf),
      goal_bf: Number(profileData.goal_bf),
      activityFactor: Number(profileData.activity_factor),
      gender: profileData.gender,
      proteinFactor: Number(profileData.protein_factor),
    };

    let formattedMealPlan = null;
    if (profileData.meal_plan) {
      formattedMealPlan = profileData.meal_plan;
    }

    // Format foodLogs
    const formattedFoodLogs = foodLogs.map(log => ({
      id: log.id,
      date: log.date,
      meal: log.meal || "Almoço",
      foodName: log.food_name,
      qty: Number(log.qty),
      kcal: Number(log.kcal),
      protein: Number(log.protein),
      carbs: Number(log.carbs),
      fat: Number(log.fat)
    }));

    // Format workoutLogs
    const formattedWorkoutLogs = workoutLogs.map(log => ({
      id: log.id,
      date: log.date,
      type: log.type,
      exercises: log.exercises,
      notes: log.notes,
      volume: Number(log.volume)
    }));

    // Format weightLogs
    const formattedWeightLogs = weightLogs.map(log => ({
      id: log.id,
      date: log.date,
      value: Number(log.value)
    }));

    // Format customFoods
    const formattedCustomFoods = customFoods.map(food => ({
      id: food.id,
      name: food.name,
      kcal: Number(food.kcal),
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
      unit: food.unit
    }));

    // Format progressPhotos
    const formattedProgressPhotos = progressPhotos.map(photo => ({
      id: photo.id,
      date: photo.date,
      week: photo.week,
      images: photo.image_urls
    }));

    return {
      profile: formattedProfile,
      mealPlan: formattedMealPlan,
      foodLogs: formattedFoodLogs,
      workoutLogs: formattedWorkoutLogs,
      weightLogs: formattedWeightLogs,
      customFoods: formattedCustomFoods,
      customExercises: formattedCustomExercises,
      schedule: formattedSchedule,
      progressPhotos: formattedProgressPhotos,
      workoutPlans: (workoutPlansRow && workoutPlansRow.plans) || null
    };

  } catch (err) {
    console.error("Error fetching user data from Supabase:", err);
    throw err;
  }
}

/**
 * Migrates local/guest state data to Supabase upon first-time sign-in.
 */
export async function migrateLocalData(userId, localData) {
  if (!supabase) return;

  try {
    // 1. Insert or update profile (with optional meal plan)
    const profileToSave = {
      id: userId,
      weight: localData.profile.weight,
      height: localData.profile.height,
      age: localData.profile.age,
      current_bf: localData.profile.current_bf,
      goal_bf: localData.profile.goal_bf,
      activity_factor: localData.profile.activityFactor,
      gender: localData.profile.gender,
      protein_factor: localData.profile.proteinFactor,
      meal_plan: localData.mealPlan,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileToSave);

    if (profileError) throw profileError;

    // 2. Insert food logs
    if (localData.foodLogs && localData.foodLogs.length > 0) {
      const foodLogsToSave = localData.foodLogs.map(log => ({
        user_id: userId,
        date: log.date,
        food_name: log.foodName,
        qty: log.qty,
        kcal: log.kcal,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat
      }));
      const { error: foodError } = await supabase
        .from("food_logs")
        .insert(foodLogsToSave);
      if (foodError) throw foodError;
    }

    // 3. Insert workout logs
    if (localData.workoutLogs && localData.workoutLogs.length > 0) {
      const workoutLogsToSave = localData.workoutLogs.map(log => ({
        user_id: userId,
        date: log.date,
        type: log.type,
        exercises: log.exercises,
        notes: log.notes,
        volume: log.volume
      }));
      const { error: workoutError } = await supabase
        .from("workout_logs")
        .insert(workoutLogsToSave);
      if (workoutError) throw workoutError;
    }

    // 4. Insert weight logs
    if (localData.weightLogs && localData.weightLogs.length > 0) {
      const weightLogsToSave = localData.weightLogs.map(log => ({
        user_id: userId,
        date: log.date,
        value: log.value
      }));
      const { error: weightError } = await supabase
        .from("weight_logs")
        .insert(weightLogsToSave);
      if (weightError) throw weightError;
    }

    // 5. Insert custom foods
    if (localData.customFoods && localData.customFoods.length > 0) {
      const customFoodsToSave = localData.customFoods.map(food => ({
        id: food.id,
        user_id: userId,
        name: food.name,
        kcal: food.kcal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        unit: food.unit
      }));
      const { error: foodCustomError } = await supabase
        .from("custom_foods")
        .insert(customFoodsToSave);
      if (foodCustomError) throw foodCustomError;
    }

    // 6. Insert custom exercises
    const customExsToSave = [];
    if (localData.customExercises) {
      Object.entries(localData.customExercises).forEach(([group, names]) => {
        names.forEach(name => {
          customExsToSave.push({
            user_id: userId,
            group,
            name
          });
        });
      });
    }
    if (customExsToSave.length > 0) {
      const { error: exCustomError } = await supabase
        .from("custom_exercises")
        .insert(customExsToSave);
      if (exCustomError) throw exCustomError;
    }

    // 6b. Insert workout plans (exercícios salvos por divisão, ex: Upper, Lower...)
    if (localData.workoutPlans && Object.keys(localData.workoutPlans).length > 0) {
      const { error: plansError } = await supabase
        .from("workout_plans")
        .upsert({
          user_id: userId,
          plans: localData.workoutPlans,
          updated_at: new Date().toISOString()
        });
      if (plansError) throw plansError;
    }

    // 7. Insert schedule — upsert em vez de apagar-depois-inserir, pelo mesmo motivo
    // explicado em saveSchedule() acima.
    if (localData.schedule && localData.schedule.length > 0) {
      const scheduleToSave = localData.schedule.map(item => ({
        user_id: userId,
        day: item.day,
        type: item.type,
        color: item.color,
        cal_type: item.calType,
        group_name: item.group
      }));
      const { error: schedError } = await supabase
        .from("schedule")
        .upsert(scheduleToSave, { onConflict: "user_id,day" });
      if (schedError) throw schedError;
    }

    // 8. Insert progress photos (uploading Base64 strings to Storage)
    if (localData.progressPhotos && localData.progressPhotos.length > 0) {
      const progressPhotosToSave = [];
      for (const entry of localData.progressPhotos) {
        const uploadedImages = {};
        for (const [angle, base64] of Object.entries(entry.images || {})) {
          if (base64 && base64.startsWith("data:")) {
            try {
              const url = await uploadBase64Photo(userId, base64, `migrated-${entry.id}-${angle}.jpg`);
              uploadedImages[angle] = url;
            } catch (err) {
              console.error("Failed to upload migrated photo:", err);
              uploadedImages[angle] = base64;
            }
          } else {
            uploadedImages[angle] = base64;
          }
        }
        progressPhotosToSave.push({
          user_id: userId,
          date: entry.date,
          week: entry.week,
          image_urls: uploadedImages
        });
      }
      if (progressPhotosToSave.length > 0) {
        const { error: photoError } = await supabase
          .from("progress_photos")
          .insert(progressPhotosToSave);
        if (photoError) throw photoError;
      }
    }
  } catch (err) {
    console.error("Migration to Supabase failed:", err);
    throw err;
  }
}

// State mutations helpers

export async function saveProfile(userId, profile, mealPlan) {
  if (!supabase) return;
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      current_bf: profile.current_bf,
      goal_bf: profile.goal_bf,
      activity_factor: profile.activityFactor,
      gender: profile.gender,
      protein_factor: profile.proteinFactor,
      meal_plan: mealPlan,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

export async function addFoodLog(userId, log) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("food_logs")
    .insert({
      user_id: userId,
      date: log.date,
      meal: log.meal || "Almoço",
      food_name: log.foodName,
      qty: log.qty,
      kcal: log.kcal,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteFoodLog(userId, logId) {
  if (!supabase) return;
  const { error } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addWorkoutLog(userId, log) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workout_logs")
    .insert({
      user_id: userId,
      date: log.date,
      type: log.type,
      exercises: log.exercises,
      notes: log.notes,
      volume: log.volume
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateWorkoutLog(userId, logId, log) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workout_logs")
    .update({
      exercises: log.exercises,
      notes: log.notes,
      volume: log.volume
    })
    .eq("id", logId)
    .eq("user_id", userId)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteWorkoutLog(userId, logId) {
  if (!supabase) return;
  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addWeightLog(userId, log) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: userId,
      date: log.date,
      value: log.value
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function addCustomFood(userId, food) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("custom_foods")
    .insert({
      id: food.id,
      user_id: userId,
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      unit: food.unit
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function addCustomExercise(userId, group, name) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("custom_exercises")
    .insert({
      user_id: userId,
      group,
      name
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function saveWorkoutPlans(userId, plans) {
  if (!supabase) return;
  const { error } = await supabase
    .from("workout_plans")
    .upsert({
      user_id: userId,
      plans,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

export async function saveSchedule(userId, schedule) {
  if (!supabase) return;
  // IMPORTANTE: antes isso apagava a semana inteira e só depois inserisse a nova — duas
  // chamadas separadas, não uma transação. Se o insert falhasse por qualquer motivo
  // depois do delete já ter rodado (rede instável, um race de RLS, etc.), a tabela
  // ficava permanentemente vazia na nuvem, sem nenhuma forma de desfazer — essa é a
  // causa raiz do "às vezes sincroniza e apaga tudo". Como a semana sempre tem
  // exatamente 7 dias fixos e a tabela tem uma constraint única (user_id, day), um
  // upsert nessa constraint atualiza/insere cada linha atomicamente, sem nunca precisar
  // apagar nada antes.
  const rows = schedule.map(item => ({
    user_id: userId,
    day: item.day,
    type: item.type,
    color: item.color,
    cal_type: item.calType,
    group_name: item.group
  }));
  const { error } = await supabase.from("schedule").upsert(rows, { onConflict: "user_id,day" });
  if (error) throw error;
}

export async function addProgressPhoto(userId, photoRecord) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      user_id: userId,
      date: photoRecord.date,
      week: photoRecord.week,
      image_urls: photoRecord.images
    })
    .select();
  if (error) throw error;
  return data[0];
}
