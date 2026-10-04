package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"awesomeProject11/internal/service"
)

func Auth(authSvc *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		}
		token := strings.TrimPrefix(header, "Bearer ")
		userID, err := authSvc.ValidateAccessToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		}
		c.Locals("user_id", userID)
		return c.Next()
	}
}
