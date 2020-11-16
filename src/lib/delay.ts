/**
 * 
 * Let the current thread sleep for a period.
 * 
 * @param time - The time we want the current function to sleep, milliseconds.
 */
export const delay = (time: number) => new Promise(r => setTimeout(r, time));