// Global setup that runs before test environment is created
// This ensures window is available before any store imports
export default function globalSetup() {
  console.log('Global setup running...')

  // This will be picked up by happy-dom when it creates the environment
  return () => {
    console.log('Global teardown')
  }
}
