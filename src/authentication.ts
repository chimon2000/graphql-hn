const HEADER_REGEX = /Bearer token-(.*)$/

export const authenticate = async ({ headers: { authorization } }, Users) => {
  try {
    const email = authorization && HEADER_REGEX.exec(authorization)[1]
    return email && (await Users.findOne({ email }))
  } catch (error) {
    return {}
  }
}
