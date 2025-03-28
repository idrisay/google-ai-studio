import mysql from "mysql2/promise"; // Import mysql2 with promise support

// Create a connection to the database
const connection = await mysql.createConnection({
  host: "localhost", // Replace with your MySQL host
  user: "root", // Replace with your MySQL username
  password: "root", // Replace with your MySQL password
  database: "staging_2024_12_06", // Replace with your database name
});

export async function getExercises(number_of_exercises, starting_id = null) {
  try {
    let query;
    let params = [];

    if (starting_id) {
      query = `SELECT * FROM exercises WHERE public_status = 'publish' AND id >= ? LIMIT ${number_of_exercises}`;
      params = [starting_id];
    } else {
      query = `SELECT * FROM exercises WHERE public_status = 'publish' LIMIT ${number_of_exercises}`;
    }

    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export const parseExercise = (exercise) => {
  return {
    id: exercise.id,
    public_title: exercise.public_title,
    instruction: exercise.instruction,
    instruction_elements: exercise.instruction_elements,
    answer_elements: exercise.answer_elements,
    type: exercise.type,
  };
};
