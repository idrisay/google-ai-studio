import mysql from "mysql2/promise"; // Import mysql2 with promise support

// Create a connection to the database
const connection = await mysql.createConnection({
  host: "localhost", // Replace with your MySQL host
  user: "root", // Replace with your MySQL username
  password: "root", // Replace with your MySQL password
  database: "staging_2024_12_06", // Replace with your database name
});

export async function getExercises(number_of_exercises) {
  console.log(number_of_exercises);
  try {
    // Query to fetch the first 10 exercises
    const [rows] = await connection.execute(
      `SELECT * FROM exercises LIMIT ${number_of_exercises}`
    );

    return rows;
  } catch (error) {
    console.error("Error fetching exercises:", error);
  } finally {
    // Close the database connection
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
